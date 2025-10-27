import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, FileText, Home, Package } from 'lucide-react';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import { CartItem } from '@/types';

interface OrderConfirmationData {
  order: {
    id: string;
    order_number: string;
    delivery_otp?: string;
    scheduled_delivery_time?: string;
    total_amount: number;
  };
  items: CartItem[];
  paymentMethod: 'online' | 'cod';
  total: number;
}

export default function OrderConfirmation() {
  const [orderData, setOrderData] = useState<OrderConfirmationData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get order confirmation data from sessionStorage
    const data = sessionStorage.getItem('orderConfirmation');
    if (data) {
      setOrderData(JSON.parse(data));
      // Clear the data after loading
      sessionStorage.removeItem('orderConfirmation');
    } else {
      // No order data, redirect to cart
      navigate('/cart');
    }
  }, [navigate]);

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading order confirmation...</p>
        </div>
      </div>
    );
  }

  const estimatedDelivery = orderData.order.scheduled_delivery_time 
    ? new Date(orderData.order.scheduled_delivery_time)
    : new Date(Date.now() + 2 * 60 * 60 * 1000);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
            <p className="text-gray-600">
              Your printing order has been placed successfully
            </p>
          </div>

          {/* Order Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Order Details</span>
                <Badge variant="secondary">{orderData.order.order_number}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Payment Method</p>
                  <p className="font-medium capitalize">
                    {orderData.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Total Amount</p>
                  <p className="font-medium">₹{orderData.order.total_amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Estimated Delivery</p>
                  <p className="font-medium">
                    {estimatedDelivery.toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                {orderData.order.delivery_otp && (
                  <div>
                    <p className="text-gray-600">Delivery OTP</p>
                    <p className="font-mono font-bold text-blue-600">{orderData.order.delivery_otp}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Order Items ({orderData.items.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orderData.items.map((item, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium">{item.document_name}</h4>
                      <p className="text-sm text-gray-600">
                        {item.total_pages} pages • {item.copies} copies • {item.color_mode} • {item.sides}
                      </p>
                      {(item.spiral_binding > 0 || item.record_binding > 0) && (
                        <p className="text-sm text-gray-600">
                          {item.spiral_binding > 0 && `Spiral Binding: ${item.spiral_binding}`}
                          {item.spiral_binding > 0 && item.record_binding > 0 && ' • '}
                          {item.record_binding > 0 && `Record Binding: ${item.record_binding}`}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{item.price.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Important Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Important Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Your order will be processed and ready within 2 hours</span>
                </div>
                {orderData.order.delivery_otp && (
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>
                      Delivery OTP: <span className="font-mono font-bold">{orderData.order.delivery_otp}</span> - 
                      Share this with our delivery person
                    </span>
                  </div>
                )}
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>
                    {orderData.paymentMethod === 'cod' 
                      ? 'Payment will be collected at the time of delivery'
                      : 'Payment has been processed successfully'
                    }
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>You will receive updates via email and SMS</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => navigate('/orders')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Track Your Order
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full" 
              size="lg"
              onClick={() => navigate('/')}
            >
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
