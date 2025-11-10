import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Clock, CheckCircle, Package, Loader2, type LucideIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import { formatPrice } from '@/lib/pricing';

interface OrderItem {
  id: string;
  document_name: string;
  total_pages: number;
  copies: number;
  color_mode?: string;
  sides?: string;
  price: number;
}

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  status: string;
  delivery_otp: string;
  order_items: OrderItem[];
  created_at: string;
  is_guest?: boolean;
  guest_name?: string;
  guest_email?: string;
}

interface StatusConfig {
  label: string;
  color: string;
  icon: LucideIcon;
}

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();

    // ✅ Real-time subscription for order updates
    const ordersSubscription = supabase
      .channel('my-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          console.log('Order updated, refreshing...');
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
    };
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/login');
        return;
      }

      // ✅ UPDATED: Get both authenticated orders AND guest orders by email
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .or(`user_id.eq.${user.id},and(guest_email.eq.${user.email},is_guest.eq.true)`)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setOrders(data || []);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, StatusConfig> = {
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800', icon: Package },
      ready: { label: 'Ready', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      delivered: { label: 'Delivered', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">Loading orders...</span>
          </div>
        </main>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">My Orders</h1>
          <p className="text-gray-600 mb-8">Track your printing orders</p>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {orders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No orders yet</h3>
                <p className="text-gray-600 mb-4">Start by uploading your documents</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold">{order.order_number}</h3>
                          {getStatusBadge(order.status)}
                          {/* ✅ Show "Guest Order" badge if it was a guest order */}
                          {order.is_guest && (
                            <Badge variant="outline" className="text-xs">
                              Guest Order
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">{formatPrice(order.total_amount)}</p>
                        <p className="text-sm text-gray-600 capitalize">{order.payment_method}</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {order.order_items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2 border-t">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="font-medium text-sm">{item.document_name}</p>
                              <p className="text-xs text-gray-500">
                                {item.total_pages} pages • {item.copies} {item.copies === 1 ? 'copy' : 'copies'}
                                {item.color_mode && ` • ${item.color_mode}`}
                                {item.sides && ` • ${item.sides}`}
                              </p>
                            </div>
                          </div>
                          <span className="font-medium">{formatPrice(item.price)}</span>
                        </div>
                      ))}
                    </div>

                    {/* ✅ Show OTP for ready orders */}
                    {order.status === 'ready' && (
                      <Alert className="bg-green-50 border-green-200">
                        <AlertDescription className="flex items-center justify-between">
                          <span className="text-green-800 font-medium">
                            ✅ Your print is ready! Come pick it up from the store.
                          </span>
                          <span className="text-sm font-mono font-bold text-green-600">
                            OTP: {order.delivery_otp}
                          </span>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* ✅ Show payment status for COD orders */}
                    {order.payment_method === 'cod' && order.payment_status === 'pending' && order.status !== 'delivered' && (
                      <Alert className="bg-blue-50 border-blue-200 mt-3">
                        <AlertDescription className="text-blue-800 text-sm">
                          💰 Payment due on delivery
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* ✅ Show delivered confirmation */}
                    {order.status === 'delivered' && (
                      <Alert className="bg-gray-50 border-gray-200 mt-3">
                        <AlertDescription className="text-gray-700 text-sm flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                          Order delivered successfully
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
