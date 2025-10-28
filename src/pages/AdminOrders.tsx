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
    
    // Call Edge Function to handle everything
    const { data, error } = await supabase.functions.invoke('update-order-status', {
      body: {
        orderId: orderId,
        newStatus: newStatus
      }
    });

    if (error) {
      console.error('[Admin] Error:', error);
      throw new Error(error.message);
    }

    if (!data.success) {
      throw new Error(data.error || 'Update failed');
    }

    // Update local state
    setOrders(orders.map(o => 
      o.id === orderId ? { ...o, status: newStatus } : o
    ));

    console.log('[Admin] ✅', data.message);
    toast.success(data.message || `Order status updated to ${newStatus}`);

  } catch (err) {
    console.error('[Admin] Error updating status:', err);
    toast.error('Failed to update status');
  } finally {
    setUpdating(null);
  }
};


  // ✅ Separate email sending function
  const sendStatusEmail = async (order: Order, newStatus: string, userEmail: string, userName: string) => {
    console.log('[Admin] Sending status update email to:', userEmail);

    const response = await supabase.functions.invoke('send-status-update-email', {
      body: {
        orderNumber: order.order_number,
        newStatus: newStatus,
        userEmail: userEmail,
        userName: userName,
        totalAmount: order.total_amount
      }
    });

    if (response.error) {
      console.error('[Admin] Email notification failed:', response.error);
      toast.error('Status updated but email failed to send');
    } else {
      console.log('[Admin] ✅ Email notification sent successfully');
      toast.success(`Status updated and ${newStatus} email sent to customer`);
    }
  };

  const handlePreviewFile = async (fileUrl: string) => {
    try {
      console.log('[Admin] Original URL:', fileUrl);
      
      const pathMatch = fileUrl.match(/\/storage\/v1\/object\/public\/documents\/(.*)/);
      
      if (!pathMatch || !pathMatch[1]) {
        console.error('[Admin] Could not extract file path from URL');
        toast.error('Invalid file URL');
        return;
      }

      const filePath = pathMatch[1];
      console.log('[Admin] File path:', filePath);

      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600);

      if (error) {
        console.error('[Admin] Signed URL error:', error);
        toast.error('File not found or has been deleted');
        return;
      }

      if (data?.signedUrl) {
        console.log('[Admin] Opening signed URL');
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('[Admin] Error:', error);
      toast.error('Failed to open file');
    }
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
      {/* Admin Header - Mobile Optimized */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-xs md:text-sm text-gray-600">Manage all orders</p>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <Button onClick={loadOrders} variant="outline" size="sm" className="h-8 md:h-9">
                <RefreshCw className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                <span className="hidden md:inline">Refresh</span>
              </Button>
              <Button onClick={handleLogout} variant="outline" size="sm" className="h-8 md:h-9">
                <LogOut className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                <span className="hidden md:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <main className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        {/* Statistics - Mobile Optimized */}
        <div className="mb-4 md:mb-6">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-base md:text-lg">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-xl md:text-2xl font-bold text-blue-600">
                    {orders.filter(o => o.status === 'pending').length}
                  </p>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">Pending</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <p className="text-xl md:text-2xl font-bold text-yellow-600">
                    {orders.filter(o => o.status === 'processing').length}
                  </p>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">Processing</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-xl md:text-2xl font-bold text-green-600">
                    {orders.filter(o => o.status === 'ready').length}
                  </p>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">Ready</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xl md:text-2xl font-bold text-gray-600">
                    {orders.filter(o => o.status === 'delivered').length}
                  </p>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">Delivered</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3 md:space-y-4">
          {currentOrders.length === 0 ? (
            <Card>
              <CardContent className="p-8 md:p-12 text-center">
                <FileText className="h-12 w-12 md:h-16 md:w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base md:text-lg font-medium mb-2">No orders yet</h3>
                <p className="text-sm md:text-base text-gray-600">Orders will appear here when customers place them</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {currentOrders.map((order) => {
                const isExpanded = expandedOrders.has(order.id);

                return (
                  <Card key={order.id} className="overflow-hidden">
                    {/* Order Header - Mobile Optimized */}
                    <div
                      className="p-4 md:p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleOrder(order.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="font-bold text-sm md:text-lg truncate">{order.order_number}</h3>
                            {getStatusBadge(order.status)}
                            <Badge variant="outline" className="text-xs">
                              {order.order_items.length} {order.order_items.length > 1 ? 'files' : 'file'}
                            </Badge>
                          </div>
                          <p className="text-xs md:text-sm text-gray-600">{formatDate(order.created_at)}</p>
                          <p className="text-[10px] md:text-xs text-gray-500 font-mono mt-1 truncate">
                            User ID: {order.user_id.substring(0, 8)}...
                          </p>
                          <p className="text-xs md:text-sm text-gray-700 mt-2">
                            <strong>{order.order_items.length} files</strong> • <strong>{order.payment_method.toUpperCase()}</strong>
                          </p>
                        </div>
                        <div className="text-right flex items-start gap-2 md:gap-4">
                          <div>
                            <p className="text-lg md:text-2xl font-bold whitespace-nowrap">{formatPrice(order.total_amount)}</p>
                            <p className="text-[10px] md:text-xs text-gray-600 mt-1">
                              OTP: <span className="font-mono font-bold text-blue-600">{order.delivery_otp}</span>
                            </p>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 md:h-6 md:w-6 text-gray-400 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-5 w-5 md:h-6 md:w-6 text-gray-400 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content - Mobile Optimized */}
                    {isExpanded && (
                      <div className="border-t bg-gray-50">
                        <CardContent className="p-4 md:p-6">
                          <div className="mb-6">
                            <h4 className="font-semibold text-xs md:text-sm text-gray-700 mb-3">
                              Files to Print ({order.order_items.length}):
                            </h4>
                            <div className="space-y-3">
                              {order.order_items.map((item, idx) => (
                                <div key={idx} className="bg-white rounded-lg border hover:border-blue-300 transition-colors overflow-hidden">
                                  {/* File Header - Mobile Optimized */}
                                  <div className="p-3">
                                    <div className="flex items-start gap-2 md:gap-3 mb-3">
                                      <div className="bg-blue-100 p-2 rounded flex-shrink-0">
                                        <FileText className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-xs md:text-sm truncate">{item.document_name}</p>
                                        <p className="text-[10px] md:text-xs text-gray-500 mt-1">
                                          {item.total_pages}p • {item.copies}x • {item.color_mode} • {item.sides}
                                        </p>
                                      </div>
                                      <span className="font-bold text-gray-900 text-sm md:text-lg whitespace-nowrap">{formatPrice(item.price)}</span>
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePreviewFile(item.document_url);
                                      }}
                                      className="w-full bg-blue-600 hover:bg-blue-700 text-xs md:text-sm h-8 md:h-9"
                                    >
                                      <ExternalLink className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                                      Preview & Print
                                    </Button>
                                  </div>

                                  {/* Custom Page Details */}
                                  {item.color_mode === 'custom' && item.custom_pages_config && (
                                    <div className="bg-amber-50 border-t border-amber-200 p-3">
                                      <div className="flex items-start gap-2">
                                        <Palette className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                          <p className="text-xs md:text-sm font-medium text-amber-900 mb-2">⚠️ Custom Pages:</p>
                                          <div className="space-y-1 text-[10px] md:text-xs">
                                            {item.custom_pages_config.colorPages && (
                                              <p className="text-amber-800">
                                                <span className="font-semibold">Color:</span> {item.custom_pages_config.colorPages}
                                              </p>
                                            )}
                                            {item.custom_pages_config.bwPages && (
                                              <p className="text-amber-800">
                                                <span className="font-semibold">B&W:</span> {item.custom_pages_config.bwPages}
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

                          {/* Status Update - Mobile Optimized */}
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-4 border-t">
                            <div className="flex flex-col md:flex-row md:items-center gap-2">
                              <span className="text-xs md:text-sm text-gray-600 font-medium">Update Status:</span>
                              <Select
                                value={order.status}
                                onValueChange={(value) => handleStatusUpdate(order.id, value)}
                                disabled={updating === order.id}
                              >
                                <SelectTrigger className="w-full md:w-[180px] h-9 text-sm">
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
                              <div className="text-xs md:text-sm text-blue-600 flex items-center gap-2">
                                <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                                Updating...
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </div>
                    )}
                  </Card>
                );
              })}

              {/* Pagination - Mobile Optimized */}
              {totalPages > 1 && (
                <Card>
                  <CardContent className="p-3 md:p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <p className="text-xs md:text-sm text-gray-600 text-center md:text-left">
                        Showing {startIndex + 1}-{Math.min(endIndex, orders.length)} of {orders.length} orders
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToPrevPage}
                          disabled={currentPage === 1}
                          className="h-8 md:h-9"
                        >
                          <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
                          <span className="hidden md:inline">Previous</span>
                        </Button>
                        <span className="text-xs md:text-sm font-medium px-2 md:px-4">
                          {currentPage}/{totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className="h-8 md:h-9"
                        >
                          <span className="hidden md:inline">Next</span>
                          <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
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
