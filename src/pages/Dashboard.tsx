import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  Upload,
  Settings,
  IndianRupee,
  Loader2,
  RefreshCw
} from 'lucide-react';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import { supabase } from '@/lib/supabase';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalSpent: number;
}

interface UserProfile {
  full_name?: string;
  email?: string;
}

interface OrderItem {
  id: string;
  document_name: string;
  total_pages: number;
  copies: number;
  price: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  payment_status: string;
  created_at: string;
  order_items: OrderItem[];
}

export default function Dashboard() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalSpent: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();

    const ordersSubscription = supabase
      .channel('dashboard-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          console.log('Order updated, refreshing dashboard...');
          loadDashboardData();
        }
      )
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
    };
  }, []);

  const loadDashboardData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        navigate('/login');
        return;
      }

      setUser({
        full_name: authUser.user_metadata?.full_name,
        email: authUser.email
      });

      // ✅ UPDATED: Get both authenticated orders AND guest orders by email
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .or(`user_id.eq.${authUser.id},and(guest_email.eq.${authUser.email},is_guest.eq.true)`)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Orders error:', ordersError);
        throw ordersError;
      }

      const allOrders = orders || [];

      const totalOrders = allOrders.length;
      const pendingOrders = allOrders.filter(o => 
        ['pending', 'processing', 'ready'].includes(o.status)
      ).length;
      const completedOrders = allOrders.filter(o => o.status === 'delivered').length;
      const totalSpent = allOrders
        .filter(o => o.payment_status === 'completed' || o.payment_method === 'cod')
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);

      setStats({
        totalOrders,
        pendingOrders,
        completedOrders,
        totalSpent
      });

      setRecentOrders(allOrders.slice(0, 3));
      setError('');
      
    } catch (err) {
      console.error('Dashboard error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData(true);
  };

  const quickActions = [
    {
      title: 'Upload Documents',
      description: 'Start a new print job',
      icon: Upload,
      action: () => navigate('/upload'),
      color: 'bg-blue-500'
    },
    {
      title: 'My Orders',
      description: 'Check your order history',
      icon: FileText,
      action: () => navigate('/my-orders'),
      color: 'bg-green-500'
    },
    {
      title: 'Shopping Cart',
      description: 'Review items in cart',
      icon: ShoppingCart,
      action: () => navigate('/cart'),
      color: 'bg-purple-500'
    }
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      delivered: 'bg-green-100 text-green-800',
      processing: 'bg-yellow-100 text-yellow-800',
      ready: 'bg-blue-100 text-blue-800',
      pending: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pending',
      processing: 'Processing',
      ready: 'Ready',
      delivered: 'Delivered'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading dashboard...</span>
          </div>
        </main>
        <MobileNav />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to view your dashboard</p>
          <Button onClick={() => navigate('/login')}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {user.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Welcome back, {user.full_name || 'User'}!
                  </h1>
                  <p className="text-gray-600">Manage your printing orders and account</p>
                </div>
              </div>
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
                <p className="text-sm text-gray-600">Total Orders</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-gray-900">{stats.pendingOrders}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-gray-900">{stats.completedOrders}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <IndianRupee className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-900">₹{stats.totalSpent.toFixed(2)}</div>
                <p className="text-sm text-gray-600">Total Spent</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="mr-2 h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start h-auto p-4 hover:bg-gray-50"
                      onClick={action.action}
                    >
                      <div className={`p-2 rounded-lg ${action.color} mr-3`}>
                        <action.icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{action.title}</p>
                        <p className="text-sm text-gray-600">{action.description}</p>
                      </div>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <FileText className="mr-2 h-5 w-5" />
                      Recent Orders
                    </CardTitle>
                    {recentOrders.length > 0 && (
                      <Button variant="outline" size="sm" onClick={() => navigate('/my-orders')}>
                        View All
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {recentOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">No orders yet</p>
                      <Button onClick={() => navigate('/upload')}>
                        <Upload className="mr-2 h-4 w-4" />
                        Start Printing
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentOrders.map((order) => (
                        <div 
                          key={order.id} 
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => navigate('/my-orders')}
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-semibold">{order.order_number}</span>
                              <Badge className={getStatusColor(order.status)}>
                                {getStatusLabel(order.status)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {order.order_items?.[0]?.document_name || 'Order items'}
                              {order.order_items && order.order_items.length > 1 && 
                                ` +${order.order_items.length - 1} more`
                              }
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(order.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-gray-900">₹{order.total_amount.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
