export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string; 
  role: 'customer' | 'owner';
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

// ✅ NEW: Guest checkout types
export interface GuestDetails {
  name: string;
  phone: string;
  email: string;
  createAccount?: boolean;
  password?: string; 
}


export type OrderStatus = 'placed' | 'processing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type PaymentMethod = 'cod' | 'online';
export type PaymentStatus = 'pending' | 'completed' | 'failed';
export type ColorMode = 'bw' | 'color' | 'custom';
export type Sides = 'single' | 'double';

export interface Order {
  id: string;
  user_id: string | null; // ✅ Allow null for guest orders
  order_number: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  total_amount: number;
  delivery_otp?: string;
  otp_verified: boolean;
  scheduled_delivery_time?: string;
  delivered_at?: string;
  created_at: string;
  order_items: OrderItem[];
  
  // ✅ NEW: Guest order fields
  is_guest?: boolean;
  guest_name?: string;
  guest_phone?: string;
  guest_email?: string;
}

export interface CartItem {
  id: string;
  document_name: string;
  document_url: string;
  total_pages: number;
  copies: number;
  color_mode: string;
  sides: string;
  paper_size: string;
  spiral_binding: number;
  record_binding: number;
  price: number;
  custom_pages_config?: {
    bwPages: string;
    colorPages: string;
  };
}

export interface OrderItem {
  id: string;
  order_id: string;
  document_url: string;
  document_name: string;
  total_pages: number;
  copies: number;
  color_mode: 'bw' | 'color' | 'custom';
  custom_pages_config?: Record<string, unknown>;
  sides: 'single' | 'double';
  paper_size: string;
  price: number;
  spiral_binding: number;
  record_binding: number;
}

export interface PricingConfig {
  bw_single: number;
  bw_double: number;
  color_single: number;
  color_double: number;
  line_graph_sheet: number;
  semi_log_graph_sheet: number;
}

export interface PaymentTransaction {
  id: string;
  order_id: string;
  payment_id: string;
  payment_method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  gateway_response?: Record<string, string | number>;
  created_at: string;
}
