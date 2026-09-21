/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProductPage } from './components/ProductPage';
import { SizingGuideModal } from './components/SizingGuideModal';
import { ReviewsModal } from './components/ReviewsModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { LiveChatWidget } from './components/LiveChatWidget';
import { NotificationToast, ToastMessage } from './components/NotificationToast';
import { OrdersDispatchModal } from './components/OrdersDispatchModal';

import { SINGLE_PRODUCT, REVIEWS } from './data/mockData';
import { Product, CartItem, GloveSize, Currency, Review, Order } from './types';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'product'>('home');
  const [currency, setCurrency] = useState<Currency>('EUR');
  
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('oci_cart_items_v2');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [reviews, setReviews] = useState<Review[]>(REVIEWS);
  const product: Product = SINGLE_PRODUCT;

  // Modals & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSizingModalOpen, setIsSizingModalOpen] = useState(false);
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  // Pop-up Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Scroll to top on page navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  useEffect(() => {
    try {
      localStorage.setItem('oci_cart_items_v2', JSON.stringify(cartItems));
    } catch (e) {
      console.warn('Could not persist cart:', e);
    }
  }, [cartItems]);

  const addToast = (title: string, description?: string) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddToCart = (product: Product, size: GloveSize, quantity: number = 1) => {
    const cartItemId = `${product.id}-${size}`;

    setCartItems((prev) => {
      const existing = prev.find((item) => item.cartItemId === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [
        ...prev,
        {
          cartItemId,
          product,
          selectedSize: size,
          selectedCut: product.cut,
          quantity
        }
      ];
    });

    addToast('Added to Match Bag', `${product.name} (Size ${size})`);
  };

  const handleBuyNow = (product: Product, size: GloveSize, quantity: number = 1) => {
    handleAddToCart(product, size, quantity);
    setIsCheckoutOpen(true);
  };

  const handleUpdateQuantity = (cartItemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
    addToast('Item Removed', 'Matchday bag updated');
  };

  const handleApplyPromo = (code: string): boolean => {
    const clean = code.trim().toUpperCase();
    if (clean === 'OCI10') {
      setAppliedPromo('OCI10');
      setDiscountPercentage(10);
      addToast('Promo Applied', '10% Locker Room discount applied');
      return true;
    }
    if (clean === 'GAACLUB20') {
      setAppliedPromo('GAACLUB20');
      setDiscountPercentage(20);
      addToast('Club Code Applied', '20% GAA Club discount applied');
      return true;
    }
    return false;
  };

  const handleAddReview = (newRev: Omit<Review, 'id' | 'date' | 'helpfulCount'>) => {
    const created: Review = {
      ...newRev,
      id: `rev-${Date.now()}`,
      date: 'Just now',
      helpfulCount: 0
    };
    setReviews((prev) => [created, ...prev]);
    addToast('Review Published', 'Thank you for your Gaelic matchday feedback!');
  };

  const handleOrderCompleted = (order: Order) => {
    setRecentOrders((prev) => [order, ...prev]);
    addToast('Order Dispatched', `Order #${order.orderId} logged & dispatched to contactocisports@gmail.com`);
  };

  const cartTotalCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div className="min-h-screen bg-black text-[#f4f4f5] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-[#e5b338]/30 selection:text-white">
      
      {/* Minimal Top Header */}
      <Navbar
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page)}
        cartCount={cartTotalCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenReviews={() => setIsReviewsModalOpen(true)}
        onOpenChat={() => {
          const chatBtn = document.getElementById('open-live-chat-btn');
          if (chatBtn) chatBtn.click();
        }}
        currency={currency}
        onCurrencyChange={setCurrency}
      />

      {/* Page Routing (No long scroll: Loads new page when clicking SHOP NOW) */}
      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {currentPage === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col"
            >
              <Hero onShopNow={() => setCurrentPage('product')} />
            </motion.div>
          ) : (
            <motion.div
              key="product"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col"
            >
              <ProductPage
                product={product}
                currency={currency}
                onBackToHome={() => setCurrentPage('home')}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                onOpenSizingModal={() => setIsSizingModalOpen(true)}
                reviews={reviews}
                onAddReview={handleAddReview}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Minimalistic Footer */}
      <footer className="py-7 border-t border-zinc-900 bg-black text-xs text-zinc-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="font-bold text-white uppercase tracking-wider font-['Outfit']">OCI SPORTS</span>
            <span className="text-zinc-600">•</span>
            <span>Any Condition. We Have You Covered.</span>
            <span className="text-zinc-600">•</span>
            <a
              href="mailto:contactocisports@gmail.com"
              className="text-zinc-300 hover:text-[#d4af37] underline decoration-zinc-800 hover:decoration-[#d4af37] transition-colors"
            >
              contactocisports@gmail.com
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px]">
            <span>Fast DPD & An Post Tracked</span>
            <span className="text-zinc-600">•</span>
            <button
              onClick={() => setIsSizingModalOpen(true)}
              className="hover:text-white underline cursor-pointer"
            >
              Hand Sizing Guide
            </button>
            <span className="text-zinc-600">•</span>
            <button
              onClick={() => setIsOrdersModalOpen(true)}
              className="text-[#d4af37] hover:text-[#f5df88] font-bold underline decoration-[#d4af37]/40 cursor-pointer"
            >
              Orders & Dispatch Hub
            </button>
          </div>

          <div className="text-[11px] text-zinc-500">
            © {new Date().getFullYear()} OCI Sports Ltd. All rights reserved.
          </div>
        </div>
      </footer>

      {/* MODALS & DRAWERS */}

      {/* Hand Sizing Guide Calculator Modal */}
      <SizingGuideModal
        isOpen={isSizingModalOpen}
        onClose={() => setIsSizingModalOpen(false)}
        onSelectSize={(selectedSize) => {
          addToast('Size Selected', `Selected size ${selectedSize}`);
        }}
      />

      {/* Player Reviews Modal */}
      <ReviewsModal
        isOpen={isReviewsModalOpen}
        onClose={() => setIsReviewsModalOpen(false)}
        reviews={reviews}
        onAddReview={handleAddReview}
      />

      {/* Shopping Bag Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        currency={currency}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveCartItem}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        appliedPromo={appliedPromo}
        discountPercentage={discountPercentage}
        onApplyPromo={handleApplyPromo}
      />

      {/* Multi-Step Secure Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        currency={currency}
        discountPercentage={discountPercentage}
        appliedPromo={appliedPromo}
        onOrderCompleted={handleOrderCompleted}
        onClearCart={() => setCartItems([])}
      />

      {/* Orders & Dispatch Hub for Store Manager */}
      <OrdersDispatchModal
        isOpen={isOrdersModalOpen}
        onClose={() => setIsOrdersModalOpen(false)}
        recentOrders={recentOrders}
      />

      {/* Live Chat Support Widget */}
      <LiveChatWidget />

      {/* Pop-up Micro-Notification Toast */}
      <NotificationToast
        toasts={toasts}
        onDismiss={handleDismissToast}
      />

    </div>
  );
}
