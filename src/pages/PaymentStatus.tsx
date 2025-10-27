import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';

export default function PaymentStatus() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const navigate = useNavigate();
  
  useEffect(() => {
    const transactionId = searchParams.get('id');
    
    if (transactionId) {
      verifyPayment(transactionId);
    }
  }, [searchParams]);
  
  const verifyPayment = async (transactionId: string) => {
    try {
      // Call backend to verify payment status
      const response = await fetch(`/api/verify-phonepe-payment?id=${transactionId}`);
      const data = await response.json();
      
      if (data.success) {
        setStatus('success');
        // Clear cart
        localStorage.removeItem('cart');
        sessionStorage.removeItem('checkoutItems');
      } else {
        setStatus('failed');
      }
    } catch (error) {
      setStatus('failed');
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            {status === 'loading' && (
              <>
                <Loader2 className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
                <h2 className="text-2xl font-bold mb-2">Verifying Payment...</h2>
                <p className="text-gray-600">Please wait</p>
              </>
            )}
            
            {status === 'success' && (
              <>
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
                <p className="text-gray-600 mb-6">Your order has been confirmed</p>
                <Button onClick={() => navigate('/orders')} className="w-full">
                  View Orders
                </Button>
              </>
            )}
            
            {status === 'failed' && (
              <>
                <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Payment Failed</h2>
                <p className="text-gray-600 mb-6">Please try again</p>
                <Button onClick={() => navigate('/cart')} className="w-full">
                  Back to Cart
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
