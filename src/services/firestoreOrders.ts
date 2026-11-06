import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  runTransaction
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Order, CartItem, GloveSize } from '../types';

const ORDERS_COLLECTION = 'orders';
const INVENTORY_COLLECTION = 'inventory';
const INVENTORY_DOC_ID = 'oci-elite-2-gloves';

// Current stock: Small = 5, Medium = 0 (purchased by customer), Large = 0
export const DEFAULT_LIVE_INVENTORY: Record<GloveSize, number> = {
  S: 5,
  M: 0,
  L: 0,
  'Youth M': 0,
  'Youth L': 0,
  'Adult S': 0,
  'Adult M': 0,
  'Adult L': 0,
  'Adult XL': 0,
  'Adult XXL': 0,
};

/**
 * Persist completed order to Firestore cloud database
 */
export async function saveOrderToFirestore(order: Order): Promise<boolean> {
  const path = `${ORDERS_COLLECTION}/${order.orderId}`;
  try {
    const cleanPayload = {
      orderId: order.orderId,
      paypalOrderId: order.paypalOrderId || '',
      paypalTransactionId: order.paypalTransactionId || '',
      status: order.status || 'Processing',
      dispatchStatus: order.dispatchStatus || 'processing',
      createdAt: order.createdAt || new Date().toISOString(),
      date: order.date || new Date().toISOString(),
      customerEmail: order.shippingDetails?.email || order.payerEmail || '',
      customerName: order.shippingDetails?.fullName || order.customerName || '',
      items: order.items || [],
      shippingDetails: order.shippingDetails || {},
      subtotal: Number(order.subtotal || 0),
      shippingCost: Number(order.shippingCost || 0),
      discountAmount: Number(order.discountAmount || 0),
      total: Number(order.total || 0),
      currency: order.currency || 'EUR',
      appliedPromo: order.appliedPromo || null,
      paymentMethod: order.paymentMethod || 'paypal',
      deliveryMethod: order.deliveryMethod || 'Tracked Express Delivery',
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, ORDERS_COLLECTION, order.orderId), cleanPayload);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

/**
 * Real-time subscription to orders in Firestore
 */
export function subscribeOrders(
  onOrdersUpdated: (orders: Order[]) => void,
  onError?: (err: any) => void
): () => void {
  const path = ORDERS_COLLECTION;
  try {
    const q = query(collection(db, ORDERS_COLLECTION));
    return onSnapshot(
      q,
      (snapshot) => {
        const ordersList: Order[] = [];
        snapshot.forEach((d) => {
          ordersList.push(d.data() as Order);
        });
        // Sort descending by date
        ordersList.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.date || 0).getTime();
          const dateB = new Date(b.createdAt || b.date || 0).getTime();
          return dateB - dateA;
        });
        onOrdersUpdated(ordersList);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

/**
 * Update dispatch status, tracking number, or notes for an order
 */
export async function updateOrderInFirestore(
  orderId: string,
  updates: Partial<Order>
): Promise<boolean> {
  const path = `${ORDERS_COLLECTION}/${orderId}`;
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    return false;
  }
}

/**
 * Real-time subscription to live glove sizes inventory
 */
export function subscribeInventory(
  onInventoryUpdated: (inv: Record<string, number>) => void,
  onError?: (err: any) => void
): () => void {
  const path = `${INVENTORY_COLLECTION}/${INVENTORY_DOC_ID}`;
  try {
    const invRef = doc(db, INVENTORY_COLLECTION, INVENTORY_DOC_ID);
    return onSnapshot(
      invRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          onInventoryUpdated({
            S: typeof data.S === 'number' ? data.S : 5,
            M: typeof data.M === 'number' ? data.M : 0,
            L: typeof data.L === 'number' ? data.L : 0,
          });
        } else {
          // Initialize live cloud inventory (Medium = 0 since customer bought it)
          const initial = { S: 5, M: 0, L: 0, updatedAt: new Date().toISOString() };
          try {
            await setDoc(invRef, initial);
            onInventoryUpdated({ S: 5, M: 0, L: 0 });
          } catch {}
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return () => {};
  }
}

/**
 * Atomically decrement inventory in Firestore when customer purchases
 */
export async function deductInventoryInFirestore(items: CartItem[]): Promise<boolean> {
  const path = `${INVENTORY_COLLECTION}/${INVENTORY_DOC_ID}`;
  try {
    const invRef = doc(db, INVENTORY_COLLECTION, INVENTORY_DOC_ID);
    await runTransaction(db, async (transaction) => {
      const invDoc = await transaction.get(invRef);
      const current = invDoc.exists()
        ? invDoc.data()
        : { S: 5, M: 0, L: 0 };

      const updated = {
        S: typeof current.S === 'number' ? current.S : 5,
        M: typeof current.M === 'number' ? current.M : 0,
        L: typeof current.L === 'number' ? current.L : 0,
      };

      for (const item of items) {
        const size = item.selectedSize as 'S' | 'M' | 'L';
        const qty = item.quantity || 1;
        if (updated[size] !== undefined) {
          updated[size] = Math.max(0, updated[size] - qty);
        }
      }

      transaction.set(invRef, {
        ...updated,
        updatedAt: new Date().toISOString(),
      });
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

/**
 * Set stock directly (for store owner inventory management)
 */
export async function setInventoryInFirestore(
  sizes: { S: number; M: number; L: number }
): Promise<boolean> {
  const path = `${INVENTORY_COLLECTION}/${INVENTORY_DOC_ID}`;
  try {
    const invRef = doc(db, INVENTORY_COLLECTION, INVENTORY_DOC_ID);
    await setDoc(invRef, {
      S: Math.max(0, sizes.S),
      M: Math.max(0, sizes.M),
      L: Math.max(0, sizes.L),
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}
