export type Currency = 'EUR' | 'GBP' | 'USD';

export type GloveCut = 'Negative Cut' | 'Hybrid Roll-Negative' | 'Classic Flat Palm';

export type GloveSize = 'S' | 'M' | 'L' | 'Youth M' | 'Youth L' | 'Adult S' | 'Adult M' | 'Adult L' | 'Adult XL' | 'Adult XXL';

export interface Product {
  id: string;
  name: string;
  subtitle: string;
  badge?: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  images: {
    front: string;
    back?: string;
    palm?: string;
  };
  description: string;
  cut: GloveCut;
  palmLatex: string;
  bodyMaterial: string;
  wristClosure: string;
  gripScore: number; // e.g. 9.8 / 10
  durabilityScore: number; // e.g. 9.5 / 10
  wetWeatherScore: number; // e.g. 9.9 / 10
  keyFeatures: string[];
  sizes: { size: GloveSize; inStock: boolean; stockCount: number }[];
  colorway: 'Black/Gold' | 'Black/Silver' | 'White/Gold/Silver' | 'Blackout Stealth';
  bestFor: string;
}

export interface CartItem {
  cartItemId: string;
  product: Product;
  selectedSize: GloveSize;
  selectedCut: GloveCut;
  personalization?: {
    enabled: boolean;
    text: string; // e.g. "№ 14" or "O'C"
    color: 'Gold' | 'Silver' | 'White';
  };
  quantity: number;
}

export interface Review {
  id: string;
  author: string;
  club: string;
  county: string;
  position: 'Forward' | 'Midfield' | 'Defender' | 'Goalkeeper';
  gloveModel: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  verifiedBuyer: boolean;
  gripRating: number;
  durabilityRating: number;
  helpfulCount: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'support';
  text: string;
  time: string;
  quickReplies?: string[];
}

export interface ShippingDetails {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  county: string;
  eircodePostcode: string;
  country: 'Ireland' | 'United Kingdom' | 'United States' | 'Australia' | 'Europe';
  deliveryNote?: string;
}

export interface PaymentDetails {
  paymentMethod: 'card' | 'apple_pay' | 'google_pay' | 'revolut';
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  cardName: string;
}

export interface Order {
  orderId: string;
  createdAt: string;
  items: CartItem[];
  shippingCost: number;
  discountAmount: number;
  subtotal: number;
  total: number;
  currency: Currency;
  shippingDetails: ShippingDetails;
  deliveryMethod: string;
}
