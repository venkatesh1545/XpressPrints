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
  Loader2
} from 'lucide-react';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import { supabase } from '@/lib/supabase';
import { Order } from '@/types';

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
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
        setLoading(true);
        
        // Get current user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authUser) {
        navigate('/login');
        return;
        }

        // Get user profile
        const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', authUser.id)
        .single();

        setUser(profile || { email: authUser.email });

        // Get all orders for stats (with user_id included)
        const { data: orders, error: ordersError } = await supabase
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
            created_at,
            delivered_at,
            order_items:app_7a889d397a_order_items(
            id,
            order_id,
            document_name,
            document_url,
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
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

        const allOrders = orders || [];

        // Calculate stats
        const totalOrders = allOrders.length;
        const pendingOrders = allOrders.filter(o => 
        ['placed', 'processing', 'ready', 'out_for_delivery'].includes(o.status)
        ).length;
        const completedOrders = allOrders.filter(o => o.status === 'delivered').length;
        const totalSpent = allOrders
        .filter(o => o.payment_status === 'completed')
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);

        setStats({
        totalOrders,
        pendingOrders,
        completedOrders,
        totalSpent
        });

        // Get recent orders (last 3)
        setRecentOrders(allOrders.slice(0, 3));
        setError('');
        
    } catch (err) {
        console.error('Dashboard error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
        setError(errorMessage);
    } finally {
        setLoading(false);
    }
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
      title: 'View Orders',
      description: 'Check your order history',
      icon: FileText,
      action: () => navigate('/orders'),
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
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'ready': return 'bg-blue-100 text-blue-800';
      case 'out_for_delivery': return 'bg-purple-100 text-purple-800';
      case 'placed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      placed: 'placed',
      processing: 'processing',
      ready: 'ready',
      out_for_delivery: 'in transit',
      delivered: 'delivered'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
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
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-6">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {user.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {user.full_name || user.email || 'User'}!
                </h1>
                <p className="text-gray-600">Manage your printing orders and account</p>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                <p className="text-sm text-gray-600">Total Orders</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{stats.completedOrders}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <IndianRupee className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">₹{stats.totalSpent.toFixed(2)}</div>
                <p className="text-sm text-gray-600">Total Spent</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
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
                      className="w-full justify-start h-auto p-4"
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

            {/* Recent Orders */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <FileText className="mr-2 h-5 w-5" />
                      Recent Orders
                    </CardTitle>
                    {recentOrders.length > 0 && (
                      <Button variant="outline" size="sm" onClick={() => navigate('/orders')}>
                        View All
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {recentOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-4">No orders yet</p>
                      <Button onClick={() => navigate('/upload')}>Start Printing</Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentOrders.map((order) => (
                        <div 
                          key={order.id} 
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => navigate('/orders')}
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium">{order.order_number}</span>
                              <Badge className={getStatusColor(order.status)}>
                                {getStatusLabel(order.status)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {order.order_items?.[0]?.document_name || 'No documents'}
                              {order.order_items && order.order_items.length > 1 && 
                                ` +${order.order_items.length - 1} more`
                              }
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(order.created_at).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">₹{order.total_amount.toFixed(2)}</p>
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
