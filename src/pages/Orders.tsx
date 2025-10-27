import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  Truck, 
  Package,
  RotateCcw,
  Download,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import { Order, OrderStatus } from '@/types';
import { getUserOrders } from '@/lib/orders';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const userOrders = await getUserOrders();
      setOrders(userOrders);
      setError('');
    } catch (err: unknown) {
      console.error('Error loading orders:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to load orders';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'placed': return <Clock className="h-4 w-4" />;
      case 'processing': return <Package className="h-4 w-4" />;
      case 'ready': return <CheckCircle className="h-4 w-4" />;
      case 'out_for_delivery': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'placed': return 'bg-gray-100 text-gray-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'ready': return 'bg-blue-100 text-blue-800';
      case 'out_for_delivery': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'placed': return 'Order Placed';
      case 'processing': return 'Processing';
      case 'ready': return 'Ready for Pickup';
      case 'out_for_delivery': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const filterOrdersByStatus = (status?: OrderStatus) => {
    if (!status) return orders;
    return orders.filter(order => order.status === status);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleReorder = (order: Order) => {
    // Convert order items to cart items and redirect to cart
    const cartItems = order.order_items.map(item => ({
      id: `reorder-${Date.now()}-${item.id}`,
      document_name: item.document_name,
      document_url: item.document_url,
      total_pages: item.total_pages,
      copies: item.copies,
      color_mode: item.color_mode,
      sides: item.sides,
      paper_size: item.paper_size,
      spiral_binding: item.spiral_binding || 0,
      record_binding: item.record_binding || 0,
      price: item.price
    }));

    localStorage.setItem('cart', JSON.stringify(cartItems));
    toast.success('Items added to cart!');
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-lg">{order.order_number}</h3>
              <Badge className={getStatusColor(order.status)}>
                {getStatusIcon(order.status)}
                <span className="ml-1">{getStatusLabel(order.status)}</span>
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              Placed on {formatDate(order.created_at)}
            </p>
            {order.delivered_at && (
              <p className="text-sm text-gray-600">
                Delivered on {formatDate(order.delivered_at)}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xl font-bold">₹{order.total_amount.toFixed(2)}</p>
            <p className="text-sm text-gray-600 capitalize">
              {order.payment_method} • {order.payment_status}
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {order.order_items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div className="flex items-center space-x-3">
                <FileText className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="font-medium text-sm">{item.document_name}</p>
                  <p className="text-xs text-gray-500">
                    {item.total_pages} pages • {item.copies} copies • {item.color_mode} • {item.sides}
                    {item.spiral_binding > 0 && ` • Spiral Binding (${item.spiral_binding})`}
                    {item.record_binding > 0 && ` • Record Binding (${item.record_binding})`}
                  </p>
                </div>
              </div>
              <span className="font-medium">₹{item.price.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {order.status === 'delivered' && (
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Invoice
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => handleReorder(order)}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reorder
            </Button>
          </div>
          
          {order.delivery_otp && !order.otp_verified && (
            <div className="text-sm">
              <span className="text-gray-600">Delivery OTP: </span>
              <span className="font-mono font-bold text-blue-600">{order.delivery_otp}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading orders...</span>
            </div>
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
            <p className="text-gray-600">Track and manage your printing orders</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All Orders</TabsTrigger>
              <TabsTrigger value="processing">Processing</TabsTrigger>
              <TabsTrigger value="ready">Ready</TabsTrigger>
              <TabsTrigger value="out_for_delivery">In Transit</TabsTrigger>
              <TabsTrigger value="delivered">Delivered</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div>
                {orders.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                      <p className="text-gray-600 mb-4">Start by uploading your documents</p>
                      <Button onClick={() => window.location.href = '/upload'}>Upload Documents</Button>
                    </CardContent>
                  </Card>
                ) : (
                  orders.map(order => <OrderCard key={order.id} order={order} />)
                )}
              </div>
            </TabsContent>

            <TabsContent value="processing">
              <div>
                {filterOrdersByStatus('processing').length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No processing orders</p>
                    </CardContent>
                  </Card>
                ) : (
                  filterOrdersByStatus('processing').map(order => 
                    <OrderCard key={order.id} order={order} />
                  )
                )}
              </div>
            </TabsContent>

            <TabsContent value="ready">
              <div>
                {filterOrdersByStatus('ready').length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No orders ready for pickup</p>
                    </CardContent>
                  </Card>
                ) : (
                  filterOrdersByStatus('ready').map(order => 
                    <OrderCard key={order.id} order={order} />
                  )
                )}
              </div>
            </TabsContent>

            <TabsContent value="out_for_delivery">
              <div>
                {filterOrdersByStatus('out_for_delivery').length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No orders in transit</p>
                    </CardContent>
                  </Card>
                ) : (
                  filterOrdersByStatus('out_for_delivery').map(order => 
                    <OrderCard key={order.id} order={order} />
                  )
                )}
              </div>
            </TabsContent>

            <TabsContent value="delivered">
              <div>
                {filterOrdersByStatus('delivered').length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No delivered orders</p>
                    </CardContent>
                  </Card>
                ) : (
                  filterOrdersByStatus('delivered').map(order => 
                    <OrderCard key={order.id} order={order} />
                  )
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
