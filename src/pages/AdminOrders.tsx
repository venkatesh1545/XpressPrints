import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/pricing';
import { 
  FileText, 
  Clock, 
  Package, 
  CheckCircle, 
  Loader2,
  LogOut,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Palette,
  type LucideIcon
} from 'lucide-react';

interface OrderItem {
  id: string;
  document_name: string;
  document_url: string;
  total_pages: number;
  copies: number;
  color_mode: string;
  sides: string;
  price: number;
  paper_size?: string;
  spiral_binding?: number;
  record_binding?: number;
  custom_pages_config?: {
    bwPages: string;
    colorPages: string;
  };
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
  user_id: string;
  user_email?: string;
}

interface StatusConfig {
  color: string;
  icon: LucideIcon;
}

const ORDERS_PER_PAGE = 10;

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const isAdmin = sessionStorage.getItem('admin_logged_in');
    if (!isAdmin) {
      navigate('/admin/login');
      return;
    }

    loadOrders();

    const subscription = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          console.log('[Admin] Order updated, refreshing...');
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (err) {
      console.error('[Admin] Error loading orders:', err);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const toggleOrder = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
  setUpdating(orderId);
  
  try {
    console.log(`[Admin] Updating order ${orderId} to status: ${newStatus}`);
    
    // Get order details first
    const order = orders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    // Update status in database
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) throw error;

    // Update local state
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));

    toast.success(`Order status updated to ${newStatus}`);

    // Send email notification for ready/delivered status
    if ((newStatus === 'ready' || newStatus === 'delivered') && order.user_email) {
      try {
        const response = await supabase.functions.invoke('send-status-update-email', {
          body: {
            orderNumber: order.order_number,
            newStatus: newStatus,
            userEmail: order.user_email, // ✅ Use stored email
            userName: '', // We don't have name stored, but that's okay
            totalAmount: order.total_amount
          }
        });

        if (response.error) {
          console.error('Email notification failed:', response.error);
        } else {
          console.log('✅ Email notification sent successfully');
        }
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        // Don't fail the status update if email fails
      }
    }

  } catch (err) {
    console.error('Error updating status:', err);
    toast.error(`Failed to update status`);
  } finally {
    setUpdating(null);
  }
};




  const handlePreviewFile = (fileUrl: string) => {
    window.open(fileUrl, '_blank');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_logged_in');
    sessionStorage.removeItem('admin_login_time');
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, StatusConfig> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      processing: { color: 'bg-blue-100 text-blue-800', icon: Package },
      ready: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      delivered: { color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Pagination
  const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE);
  const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
  const endIndex = startIndex + ORDERS_PER_PAGE;
  const currentOrders = orders.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading orders...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Manage all orders</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={loadOrders} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {orders.filter(o => o.status === 'pending').length}
                  </p>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {orders.filter(o => o.status === 'processing').length}
                  </p>
                  <p className="text-sm text-gray-600">Processing</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {orders.filter(o => o.status === 'ready').length}
                  </p>
                  <p className="text-sm text-gray-600">Ready</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-600">
                    {orders.filter(o => o.status === 'delivered').length}
                  </p>
                  <p className="text-sm text-gray-600">Delivered</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {currentOrders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No orders yet</h3>
                <p className="text-gray-600">Orders will appear here when customers place them</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {currentOrders.map((order) => {
                const isExpanded = expandedOrders.has(order.id);

                return (
                  <Card key={order.id} className="overflow-hidden">
                    {/* Order Header */}
                    <div
                      className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleOrder(order.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-lg">{order.order_number}</h3>
                            {getStatusBadge(order.status)}
                            <Badge variant="outline">
                              {order.order_items.length} {order.order_items.length > 1 ? 'files' : 'file'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                          <p className="text-xs text-gray-500 font-mono mt-1">
                            User ID: {order.user_id.substring(0, 8)}...
                          </p>
                          <p className="text-sm text-gray-700 mt-2">
                            <strong>{order.order_items.length} files</strong> to print • <strong>{order.payment_method.toUpperCase()}</strong>
                          </p>
                        </div>
                        <div className="text-right flex items-start gap-4">
                          <div>
                            <p className="text-2xl font-bold">{formatPrice(order.total_amount)}</p>
                            <p className="text-xs text-gray-600">Delivery OTP: <span className="font-mono font-bold text-blue-600">{order.delivery_otp}</span></p>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-6 w-6 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t bg-gray-50">
                        <CardContent className="p-6">
                          <div className="mb-6">
                            <h4 className="font-semibold text-sm text-gray-700 mb-3">
                              Files to Print ({order.order_items.length}):
                            </h4>
                            <div className="space-y-3">
                              {order.order_items.map((item, idx) => (
                                <div key={idx} className="bg-white rounded-lg border hover:border-blue-300 transition-colors overflow-hidden">
                                  {/* File Header */}
                                  <div className="flex items-center justify-between p-3">
                                    <div className="flex items-center gap-3 flex-1">
                                      <div className="bg-blue-100 p-2 rounded">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-medium text-sm">{item.document_name}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                          {item.total_pages} pages • {item.copies} {item.copies > 1 ? 'copies' : 'copy'} • {item.color_mode} • {item.sides}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="font-bold text-gray-900 text-lg">{formatPrice(item.price)}</span>
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handlePreviewFile(item.document_url);
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700"
                                      >
                                        <ExternalLink className="h-4 w-4 mr-1" />
                                        Preview & Print
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Custom Page Details */}
                                  {item.color_mode === 'custom' && item.custom_pages_config && (
                                    <div className="bg-amber-50 border-t border-amber-200 p-3">
                                      <div className="flex items-start gap-2">
                                        <Palette className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                          <p className="text-sm font-medium text-amber-900 mb-2">⚠️ Custom Page Selection:</p>
                                          <div className="space-y-1 text-xs">
                                            {item.custom_pages_config.colorPages && (
                                              <p className="text-amber-800">
                                                <span className="font-semibold">Color Pages:</span> {item.custom_pages_config.colorPages}
                                              </p>
                                            )}
                                            {item.custom_pages_config.bwPages && (
                                              <p className="text-amber-800">
                                                <span className="font-semibold">B&W Pages:</span> {item.custom_pages_config.bwPages}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Status Update */}
                          <div className="flex items-center justify-between pt-4 border-t">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600 font-medium">Update Status:</span>
                              <Select
                                value={order.status}
                                onValueChange={(value) => handleStatusUpdate(order.id, value)}
                                disabled={updating === order.id}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="processing">Processing</SelectItem>
                                  <SelectItem value="ready">Ready</SelectItem>
                                  <SelectItem value="delivered">Delivered</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {updating === order.id && (
                              <div className="text-sm text-blue-600 flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Updating status...
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </div>
                    )}
                  </Card>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        Showing {startIndex + 1}-{Math.min(endIndex, orders.length)} of {orders.length} orders
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToPrevPage}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <span className="text-sm font-medium px-4">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
