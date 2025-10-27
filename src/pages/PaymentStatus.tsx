import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';

export default function PaymentStatus() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const navigate = useNavigate();
  
  useEffect(() => {
    const transactionId = searchParams.get('id');
    
    console.log('[PaymentStatus] Transaction ID from URL:', transactionId);
    
    if (transactionId) {
      verifyPayment(transactionId);
    } else {
      console.error('[PaymentStatus] No transaction ID found');
      setStatus('failed');
    }
  }, [searchParams]);
  
  const verifyPayment = async (transactionId: string) => {
    try {
      console.log('[PaymentStatus] Verifying payment:', transactionId);
      
      // ✅ FIX: Use Supabase Edge Function URL
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-phonepe-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({ transactionId })
        }
      );

      if (!response.ok) {
        throw new Error('Verification request failed');
      }

      const data = await response.json();
      console.log('[PaymentStatus] Verification result:', data);
      
      if (data.success) {
        setStatus('success');
        // Clear cart
        localStorage.removeItem('cart');
        sessionStorage.removeItem('checkoutItems');
        sessionStorage.removeItem('merchantTransactionId');
      } else {
        setStatus('failed');
      }
    } catch (error) {
      console.error('[PaymentStatus] Verification error:', error);
      setStatus('failed');
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-16 pb-20 md:pb-16">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            {status === 'loading' && (
              <>
                <Loader2 className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
                <h2 className="text-2xl font-bold mb-2">Verifying Payment...</h2>
                <p className="text-gray-600">Please wait while we confirm your payment</p>
              </>
            )}
            
            {status === 'success' && (
              <>
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
                <p className="text-gray-600 mb-6">
                  Your order has been confirmed. You will receive your documents within 2 hours.
                </p>
                <Button onClick={() => navigate('/orders')} className="w-full">
                  View Orders
                </Button>
              </>
            )}
            
            {status === 'failed' && (
              <>
                <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Payment Failed</h2>
                <p className="text-gray-600 mb-6">
                  Your payment could not be processed. Please try again.
                </p>
                <div className="space-y-2">
                  <Button onClick={() => navigate('/cart')} className="w-full">
                    Back to Cart
                  </Button>
                  <Button 
                    onClick={() => navigate('/orders')} 
                    variant="outline" 
                    className="w-full"
                  >
                    View Orders
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>

      <MobileNav />
    </div>
  );
}
