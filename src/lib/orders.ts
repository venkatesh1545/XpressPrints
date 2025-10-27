import { supabase } from './supabase';
import { Order, CartItem } from '@/types';

// Get Supabase URL and Key from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const createOrder = async (
  items: CartItem[],
  paymentMethod: 'cod' | 'online',
  totalAmount: number
) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/app_7a889d397a_create_order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      user_id: user.id,
      items: items.map(item => ({
        document_url: item.document_url,
        document_name: item.document_name,
        total_pages: item.total_pages,
        copies: item.copies,
        color_mode: item.color_mode,
        sides: item.sides,
        paper_size: item.paper_size,
        price: item.price,
        spiral_binding: item.spiral_binding || 0,      // Changed from line_graph_sheets
        record_binding: item.record_binding || 0       // Changed from semi_log_graph_sheets
      })),
      payment_method: paymentMethod,
      total_amount: totalAmount
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create order');
  }

  return await response.json();
};

export const getUserOrders = async (): Promise<Order[]> => {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('app_7a889d397a_orders')
    .select(`
      id,
      user_id,
      order_number,
      status,
      total_amount,
      payment_method,
      payment_status,
      delivery_otp,
      otp_verified,
      scheduled_delivery_time,
      delivered_at,
      created_at,
      order_items:app_7a889d397a_order_items(
        id,
        order_id,
        document_url,
        document_name,
        total_pages,
        copies,
        color_mode,
        sides,
        paper_size,
        price,
        spiral_binding,
        record_binding
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

export const updateOrderStatus = async (
  orderId: string,
  status: string,
  otpCode?: string
) => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/app_7a889d397a_update_order_status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      order_id: orderId,
      status,
      otp_code: otpCode
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update order status');
  }

  return await response.json();
};

export const processPayment = async (
  orderId: string,
  paymentMethod: 'cod' | 'online',
  gatewayResponse?: unknown
) => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/app_7a889d397a_process_payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      order_id: orderId,
      payment_method: paymentMethod,
      payment_gateway_response: gatewayResponse
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to process payment');
  }

  return await response.json();
};
