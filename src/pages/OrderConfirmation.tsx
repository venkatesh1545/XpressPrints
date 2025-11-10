import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { CartItem, GuestDetails } from '@/types';
import { formatPrice } from '@/lib/pricing';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import GuestCheckoutModal from '@/components/checkout/GuestCheckoutModal';
import { Smartphone, Wallet, CheckCircle, Home, UserCheck } from 'lucide-react';

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
  handler: (response: RazorpayResponse) => Promise<void>;
  modal: {
    ondismiss: () => void;
  };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
    };
  }
}

const CONVENIENCE_FEE = 4;
const CONVENIENCE_FEE_THRESHOLD = 50;

export default function OrderConfirmation() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('cod');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestDetails, setGuestDetails] = useState<GuestDetails | null>(null);
  const [orderDetails, setOrderDetails] = useState<{
    orderNumber: string;
    deliveryOtp: string;
  } | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndLoadCart();
  }, [navigate]);

  const checkAuthAndLoadCart = async () => {
    const checkoutData = sessionStorage.getItem('checkoutItems');
    const savedPaymentMethod = sessionStorage.getItem('paymentMethod');
    
    if (checkoutData) {
      setCartItems(JSON.parse(checkoutData));
    } else {
      navigate('/cart');
      return;
    }
    
    if (savedPaymentMethod) {
      setPaymentMethod(savedPaymentMethod as 'online' | 'cod');
    }

    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    setIsGuest(!user);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.copies), 0);
  const convenienceFee = subtotal > CONVENIENCE_FEE_THRESHOLD ? CONVENIENCE_FEE : 0;
  const totalAmount = subtotal + convenienceFee;

  const sendNotifications = async (
    orderNumber: string,
    totalAmount: number,
    items: CartItem[],
    userEmail: string,
    userName: string
  ) => {
    try {
      console.log('[Notification] Sending emails to:', userEmail);
      
      const { data, error } = await supabase.functions.invoke('send-order-notifications', {
        body: {
          orderNumber,
          totalAmount,
          items: items.map(item => ({
            document_name: item.document_name,
            total_pages: item.total_pages,
            copies: item.copies,
            color_mode: item.color_mode || 'black & white'
          })),
          userEmail,
          userName
        }
      });
      
      if (error) {
        console.error('[Notification] Error:', error);
      } else {
        console.log('[Notification] Emails sent successfully');
      }
    } catch (error) {
      console.error('[Notification] Failed:', error);
    }
  };

  // ✅ NEW: Create account for guest user after order
  const createAccountFromGuest = async (guestInfo: GuestDetails) => {
    if (!guestInfo.createAccount || !guestInfo.password || !guestInfo.email) {
      return;
    }

    try {
      console.log('[Account] Creating account for:', guestInfo.email);

      const { data, error } = await supabase.auth.signUp({
        email: guestInfo.email,
        password: guestInfo.password,
        options: {
          data: {
            full_name: guestInfo.name,
            phone: guestInfo.phone
          }
        }
      });

      if (error) {
        console.error('[Account] Creation failed:', error);
        toast.error('Order placed but account creation failed. Please sign up manually.');
        return;
      }

      console.log('[Account] ✅ Account created successfully');
      toast.success('🎉 Account created! Check your email for verification link.');
      
    } catch (error) {
      console.error('[Account] Error:', error);
      toast.error('Failed to create account. Please sign up manually.');
    }
  };

  // Handle guest checkout modal submit
  const handleGuestDetailsSubmit = (details: GuestDetails) => {
    setGuestDetails(details);
    setShowGuestModal(false);
    
    // Proceed with payment based on selected method
    if (paymentMethod === 'online') {
      handleRazorpayPayment(details);
    } else {
      handleCODOrder(details);
    }
  };

  // Trigger checkout (guest or authenticated)
  const handleCheckoutClick = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Authenticated user - proceed directly
      if (paymentMethod === 'online') {
        handleRazorpayPayment();
      } else {
        handleCODOrder();
      }
    } else {
      // Guest user - show modal first
      setShowGuestModal(true);
    }
  };

  const handleRazorpayPayment = async (guestInfo?: GuestDetails) => {
    setIsProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Use guest info if provided, otherwise use authenticated user
      const customerEmail = guestInfo?.email || user?.email;
      const customerName = guestInfo?.name || user?.user_metadata?.full_name;
      const customerPhone = guestInfo?.phone || user?.user_metadata?.phone;

      if (!customerEmail) {
        toast.error('Email is required');
        setIsProcessing(false);
        return;
      }

      console.log('[Razorpay] Creating order for ₹', totalAmount);

      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          amount: totalAmount,
          userId: user?.id || null,
          userEmail: customerEmail,
          items: cartItems
        }
      });

      if (error || !data.success) {
        throw new Error(data?.error || 'Failed to create order');
      }

      const options: RazorpayOptions = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Xpress Prints',
        description: `${cartItems.length} documents to print`,
        order_id: data.orderId,
        prefill: {
          email: customerEmail,
          contact: customerPhone || ''
        },
        theme: {
          color: '#3b82f6'
        },
        handler: async (response: RazorpayResponse) => {
          try {
            const deliveryOtp = Math.floor(100000 + Math.random() * 900000).toString();
            const orderNumber = `ORD-${Date.now()}`;

            const orderData = {
              user_id: user?.id || null,
              user_email: customerEmail,
              order_number: orderNumber,
              total_amount: totalAmount,
              payment_method: 'online',
              delivery_otp: deliveryOtp,
              status: 'pending',
              is_guest: !user,
              guest_name: guestInfo?.name,
              guest_phone: guestInfo?.phone,
              guest_email: guestInfo?.email,
              order_items: cartItems.map(item => ({
                document_name: item.document_name,
                document_url: item.document_url,
                total_pages: item.total_pages,
                copies: item.copies,
                color_mode: item.color_mode,
                sides: item.sides,
                price: item.price,
                paper_size: item.paper_size,
                spiral_binding: item.spiral_binding || 0,
                record_binding: item.record_binding || 0,
                custom_pages_config: item.custom_pages_config
              }))
            };

            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderData: orderData
              }
            });

            if (verifyError || !verifyData.success) {
              throw new Error('Payment verification failed');
            }

            await sendNotifications(
              orderNumber,
              totalAmount,
              cartItems,
              customerEmail,
              customerName || 'Valued Customer'
            );

            // ✅ Create account if requested
            if (guestInfo?.createAccount && guestInfo?.password) {
              await createAccountFromGuest(guestInfo);
            }

            localStorage.removeItem('cart');
            sessionStorage.removeItem('checkoutItems');
            sessionStorage.removeItem('paymentMethod');

            setOrderDetails({ orderNumber, deliveryOtp });
            setShowSuccessModal(true);

          } catch (error) {
            console.error('[Razorpay] Verification failed:', error);
            toast.error('Payment verification failed. Please contact support.');
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast.info('Payment cancelled');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('[Razorpay] Error:', error);
      toast.error('Failed to initiate payment. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleCODOrder = async (guestInfo?: GuestDetails) => {
    setIsProcessing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Use guest info if provided, otherwise use authenticated user
      const customerEmail = guestInfo?.email || user?.email;
      const customerName = guestInfo?.name || user?.user_metadata?.full_name;

      if (!customerEmail) {
        toast.error('Email is required');
        setIsProcessing(false);
        return;
      }

      const deliveryOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const orderNumber = `ORD-${Date.now()}`;

      const orderData = {
        user_id: user?.id || null,
        user_email: customerEmail,
        order_number: orderNumber,
        total_amount: totalAmount,
        payment_method: 'cod',
        payment_status: 'pending',
        payment_id: null,
        delivery_otp: deliveryOtp,
        status: 'pending',
        is_guest: !user,
        guest_name: guestInfo?.name,
        guest_phone: guestInfo?.phone,
        guest_email: guestInfo?.email,
        order_items: cartItems.map(item => ({
          document_name: item.document_name,
          document_url: item.document_url,
          total_pages: item.total_pages,
          copies: item.copies,
          color_mode: item.color_mode,
          sides: item.sides,
          price: item.price,
          paper_size: item.paper_size,
          spiral_binding: item.spiral_binding || 0,
          record_binding: item.record_binding || 0,
          custom_pages_config: item.custom_pages_config
        }))
      };

      const { error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (orderError) {
        console.error('[COD] Order error:', orderError);
        throw orderError;
      }

      await sendNotifications(
        orderNumber,
        totalAmount,
        cartItems,
        customerEmail,
        customerName || 'Valued Customer'
      );

      // ✅ Create account if requested
      if (guestInfo?.createAccount && guestInfo?.password) {
        await createAccountFromGuest(guestInfo);
      }

      localStorage.removeItem('cart');
      sessionStorage.removeItem('checkoutItems');
      sessionStorage.removeItem('paymentMethod');

      setOrderDetails({ orderNumber, deliveryOtp });
      setShowSuccessModal(true);

    } catch (error) {
      console.error('[COD] Error:', error);
      toast.error('Order placement failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackToDashboard = () => {
    setShowSuccessModal(false);
    navigate('/');
  };

  if (cartItems.length === 0) {
    return null;
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Order Confirmation</h1>

            {/* Guest checkout indicator */}
            {isGuest && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <UserCheck className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Quick Checkout (No Account Required)
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Enter your details at checkout • No sign-up needed
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Order Items */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Order Items ({cartItems.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <div>
                            <p className="font-medium">{item.document_name}</p>
                            <p className="text-gray-600 text-xs">
                              {item.total_pages} pages • {item.copies} {item.copies === 1 ? 'copy' : 'copies'}
                            </p>
                          </div>
                          <span className="font-medium">{formatPrice(item.price * item.copies)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Select Payment Method</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant={paymentMethod === 'cod' ? 'default' : 'outline'}
                      className="w-full justify-start"
                      size="lg"
                      onClick={() => setPaymentMethod('cod')}
                    >
                      <Wallet className="mr-2 h-5 w-5" />
                      Cash on Delivery (COD)
                    </Button>
                    
                    <Button
                      variant={paymentMethod === 'online' ? 'default' : 'outline'}
                      className="w-full justify-start"
                      size="lg"
                      onClick={() => setPaymentMethod('online')}
                    >
                      <Smartphone className="mr-2 h-5 w-5" />
                      Pay Online
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary */}
              <div>
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal ({cartItems.length} items)</span>
                      <span className="font-medium">{formatPrice(subtotal)}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Delivery</span>
                      <span className="text-green-600 font-medium">Free</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Convenience Fee</span>
                      {convenienceFee > 0 ? (
                        <span className="font-medium">{formatPrice(convenienceFee)}</span>
                      ) : (
                        <span className="text-green-600 font-medium">Free</span>
                      )}
                    </div>

                    {subtotal <= CONVENIENCE_FEE_THRESHOLD && subtotal > 0 && (
                      <p className="text-xs text-gray-500 italic">
                        💡 No convenience fee for orders ≤ ₹{CONVENIENCE_FEE_THRESHOLD}
                      </p>
                    )}
                    
                    <Separator />
                    
                    <div className="flex justify-between">
                      <span className="font-medium">Total</span>
                      <span className="text-xl font-bold">{formatPrice(totalAmount)}</span>
                    </div>

                    <Button
                      onClick={handleCheckoutClick}
                      className="w-full"
                      size="lg"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : paymentMethod === 'online' ? 'Proceed to Pay' : 'Place Order'}
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                      {paymentMethod === 'online' 
                        ? '🔒 Secure payment via Razorpay'
                        : '✅ Free delivery within 12-24 hours'
                      }
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>

        <MobileNav />
      </div>

      {/* Guest Checkout Modal */}
      <GuestCheckoutModal
        open={showGuestModal}
        onClose={() => setShowGuestModal(false)}
        onSubmit={handleGuestDetailsSubmit}
        isLoading={isProcessing}
      />

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">Order Placed Successfully!</DialogTitle>
          </DialogHeader>
          
          <div className="text-center space-y-4 pt-2">
            <p className="text-base text-gray-600">
              Your order has been confirmed and will be delivered within 12-24 hours.
            </p>
            
            {orderDetails && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="text-sm">
                  <span className="text-gray-600">Order Number: </span>
                  <span className="font-bold text-gray-900">{orderDetails.orderNumber}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Delivery OTP: </span>
                  <span className="font-mono font-bold text-blue-600 text-lg">{orderDetails.deliveryOtp}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Save this OTP to receive your delivery
                </p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800 font-medium">
                📧 Confirmation emails have been sent to you and our admin.
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Please check your <strong>inbox or spam folder</strong> for order confirmation.
              </p>
            </div>

            {/* Account created notification */}
            {isGuest && guestDetails?.createAccount && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800 font-medium">
                  🎉 Account created successfully!
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Check your email for verification link to access your dashboard
                </p>
              </div>
            )}

            {!isGuest && (
              <p className="text-sm text-gray-600">
                You can track your order status in the <strong>"My Orders"</strong> section.
              </p>
            )}
          </div>
          
          <div className="flex flex-col gap-3 mt-4">
            {!isGuest && (
              <Button
                onClick={() => navigate('/my-orders')}
                className="w-full"
              >
                View My Orders
              </Button>
            )}
            <Button
              onClick={handleBackToDashboard}
              variant={isGuest ? "default" : "outline"}
              className="w-full"
            >
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
