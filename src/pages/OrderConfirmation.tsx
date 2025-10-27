import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { CartItem } from '@/types';
import { formatPrice } from '@/lib/pricing';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import { Smartphone, Wallet } from 'lucide-react';

const CONVENIENCE_FEE = 4;

export default function OrderConfirmation() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkoutData = sessionStorage.getItem('checkoutItems');
    const savedPaymentMethod = sessionStorage.getItem('paymentMethod');
    
    if (checkoutData) {
      setCartItems(JSON.parse(checkoutData));
    } else {
      navigate('/cart');
    }
    
    if (savedPaymentMethod) {
      setPaymentMethod(savedPaymentMethod as 'online' | 'cod');
    }
  }, [navigate]);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.copies), 0);
  const totalAmount = subtotal + CONVENIENCE_FEE;

  const handlePhonePePayment = async () => {
    setIsProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please sign in to continue');
        navigate('/login');
        return;
      }

      // Call backend to create PhonePe payment
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-phonepe-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          amount: totalAmount,
          userId: user.id,
          items: cartItems
        })
      });

      const { paymentUrl, merchantTransactionId } = await response.json();

      if (paymentUrl) {
        // Store transaction ID for verification
        sessionStorage.setItem('merchantTransactionId', merchantTransactionId);
        
        // Redirect to PhonePe payment page
        window.location.href = paymentUrl;
      } else {
        throw new Error('Failed to initialize payment');
      }

    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment initialization failed');
      setIsProcessing(false);
    }
  };

  const handleCODOrder = async () => {
    setIsProcessing(true);
    
    try {
      await createOrder('cod', 'pending', null);
      toast.success('Order placed successfully!');
      
      // Clear cart and session
      localStorage.removeItem('cart');
      sessionStorage.removeItem('checkoutItems');
      
      navigate('/orders');
    } catch (error) {
      console.error('COD order error:', error);
      toast.error('Order placement failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const createOrder = async (
    method: 'online' | 'cod',
    paymentStatus: string,
    transactionId: string | null
  ) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const deliveryOtp = Math.floor(100000 + Math.random() * 900000).toString();

    const orderData = {
      user_id: user.id,
      order_number: `ORD-${Date.now()}`,
      total_amount: totalAmount,
      payment_method: method,
      payment_status: paymentStatus,
      payment_id: transactionId,
      delivery_otp: deliveryOtp,
      status: 'pending',
      order_items: cartItems
    };

    const { error } = await supabase
      .from('orders')
      .insert([orderData]);

    if (error) throw error;
  };

  if (cartItems.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Order Confirmation</h1>

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
                    variant={paymentMethod === 'online' ? 'default' : 'outline'}
                    className="w-full justify-start"
                    size="lg"
                    onClick={() => setPaymentMethod('online')}
                  >
                    <Smartphone className="mr-2 h-5 w-5" />
                    Pay Online (UPI, Cards, Wallets)
                  </Button>
                  
                  <Button
                    variant={paymentMethod === 'cod' ? 'default' : 'outline'}
                    className="w-full justify-start"
                    size="lg"
                    onClick={() => setPaymentMethod('cod')}
                  >
                    <Wallet className="mr-2 h-5 w-5" />
                    Cash on Delivery
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
                    <span className="font-medium">{formatPrice(CONVENIENCE_FEE)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between">
                    <span className="font-medium">Total</span>
                    <span className="text-xl font-bold">{formatPrice(totalAmount)}</span>
                  </div>

                  <Button
                    onClick={paymentMethod === 'online' ? handlePhonePePayment : handleCODOrder}
                    className="w-full"
                    size="lg"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : 
                     paymentMethod === 'online' ? 'Proceed to Pay' : 'Place Order'}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    {paymentMethod === 'online' 
                      ? 'You will be redirected to PhonePe for secure payment'
                      : 'Pay cash when your order is delivered'
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
  );
}
