import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/pricing';
import { 
  IndianRupee, 
  TrendingUp, 
  TrendingDown,
  Package,
  Wallet,
  CreditCard,
  Plus,
  Loader2,
  Calendar,
  PieChart as PieChartIcon,
  BarChart3,
  LogOut,
  RefreshCw,
  Clock,
  CheckCircle
} from 'lucide-react';

interface Order {
  total_amount: number;
  payment_method: 'cod' | 'online';
  created_at: string;
  status: string;
}

interface OrderStats {
  totalOrders: number;
  totalEarnings: number;
  codEarnings: number;
  onlineEarnings: number;
  monthlyData: { month: string; cod: number; online: number; total: number }[];
}

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  expense_date: string;
  created_at: string;
}

const EXPENSE_CATEGORIES = [
  'Printing Supplies',
  'Paper & Materials',
  'Equipment Maintenance',
  'Rent',
  'Electricity',
  'Salaries',
  'Marketing',
  'Other'
];

export default function AdminEarnings() {
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    totalEarnings: 0,
    codEarnings: 0,
    onlineEarnings: 0,
    monthlyData: []
  });
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [showAddExpenseDialog, setShowAddExpenseDialog] = useState(false);
  
  // ✅ Status filter state
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'ready' | 'delivered'>('all');
  
  // Expense form state
  const [newExpense, setNewExpense] = useState({
    category: '',
    amount: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0]
  });

  const navigate = useNavigate();

  useEffect(() => {
    const isAdmin = sessionStorage.getItem('admin_logged_in');
    if (!isAdmin) {
      navigate('/admin/login');
      return;
    }

    loadData();
  }, [navigate, statusFilter]); // ✅ Reload when filter changes

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadOrderStats(), loadExpenses()]);
    } catch (error) {
      console.error('[Earnings] Error loading data:', error);
      toast.error('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const loadOrderStats = async () => {
    try {
      console.log('[Earnings] Loading orders with filter:', statusFilter);

      // ✅ Build query based on status filter
      let query = supabase
        .from('orders')
        .select('total_amount, payment_method, created_at, status');

      // Apply filter based on selection
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data: orders, error } = await query;

      if (error) throw error;

      if (!orders) {
        setStats({
          totalOrders: 0,
          totalEarnings: 0,
          codEarnings: 0,
          onlineEarnings: 0,
          monthlyData: []
        });
        return;
      }

      const codTotal = orders
        .filter(o => o.payment_method === 'cod')
        .reduce((sum, o) => sum + o.total_amount, 0);

      const onlineTotal = orders
        .filter(o => o.payment_method === 'online')
        .reduce((sum, o) => sum + o.total_amount, 0);

      const monthlyData = calculateMonthlyData(orders);

      setStats({
        totalOrders: orders.length,
        totalEarnings: codTotal + onlineTotal,
        codEarnings: codTotal,
        onlineEarnings: onlineTotal,
        monthlyData
      });

      console.log('[Earnings] Loaded', orders.length, 'orders');
    } catch (error) {
      console.error('[Earnings] Error loading orders:', error);
      throw error;
    }
  };

  const calculateMonthlyData = (orders: Order[]) => {
    const last6Months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthOrders = orders.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= monthStart && orderDate <= monthEnd;
      });

      const codEarnings = monthOrders
        .filter(o => o.payment_method === 'cod')
        .reduce((sum, o) => sum + o.total_amount, 0);

      const onlineEarnings = monthOrders
        .filter(o => o.payment_method === 'online')
        .reduce((sum, o) => sum + o.total_amount, 0);

      last6Months.push({
        month: monthName,
        cod: codEarnings,
        online: onlineEarnings,
        total: codEarnings + onlineEarnings
      });
    }

    return last6Months;
  };

  const loadExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false })
        .limit(50);

      if (error) throw error;

      setExpenses(data || []);
      const total = (data || []).reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);
      setTotalExpenses(total);
    } catch (error) {
      console.error('[Earnings] Error loading expenses:', error);
      throw error;
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.category || !newExpense.amount) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsAddingExpense(true);

    try {
      const { error } = await supabase
        .from('expenses')
        .insert([{
          category: newExpense.category,
          amount: parseFloat(newExpense.amount),
          description: newExpense.description,
          expense_date: newExpense.expense_date
        }]);

      if (error) throw error;

      toast.success('Expense added successfully');
      setShowAddExpenseDialog(false);
      setNewExpense({
        category: '',
        amount: '',
        description: '',
        expense_date: new Date().toISOString().split('T')[0]
      });

      await loadExpenses();
    } catch (error) {
      console.error('[Earnings] Error adding expense:', error);
      toast.error('Failed to add expense');
    } finally {
      setIsAddingExpense(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Expense deleted');
      await loadExpenses();
    } catch (error) {
      console.error('[Earnings] Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_logged_in');
    sessionStorage.removeItem('admin_login_time');
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  const netProfit = stats.totalEarnings - totalExpenses;
  const profitMargin = stats.totalEarnings > 0 
    ? ((netProfit / stats.totalEarnings) * 100).toFixed(1) 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading earnings data...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-gray-900">💰 Earnings Dashboard</h1>
              <p className="text-xs md:text-sm text-gray-600">Track your business performance</p>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <Button 
                onClick={() => navigate('/admin/orders')}
                variant="outline" 
                size="sm" 
                className="h-8 md:h-9"
              >
                <Package className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                <span className="hidden md:inline">Orders</span>
              </Button>
              <Button onClick={loadData} variant="outline" size="sm" className="h-8 md:h-9">
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

      {/* Main Content */}
      <div className="container mx-auto px-3 md:px-6 py-4 md:py-6">
        <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
          
          {/* ✅ Status Filter & Add Expense Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Status Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
                className="h-9"
              >
                All Orders
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('pending')}
                className="h-9"
              >
                <Clock className="h-3 w-3 mr-1" />
                Pending
              </Button>
              <Button
                variant={statusFilter === 'processing' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('processing')}
                className="h-9"
              >
                <Package className="h-3 w-3 mr-1" />
                Processing
              </Button>
              <Button
                variant={statusFilter === 'ready' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('ready')}
                className="h-9"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Ready
              </Button>
              <Button
                variant={statusFilter === 'delivered' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('delivered')}
                className="h-9"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Delivered
              </Button>
            </div>

            {/* Add Expense Button */}
            <Dialog open={showAddExpenseDialog} onOpenChange={setShowAddExpenseDialog}>
              <DialogTrigger asChild>
                <Button className="w-full md:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Expense</DialogTitle>
                  <DialogDescription>
                    Record a business expense to track your costs
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select 
                      value={newExpense.category}
                      onValueChange={(value) => setNewExpense({...newExpense, category: value})}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="amount">Amount (₹) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Optional details"
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newExpense.expense_date}
                      onChange={(e) => setNewExpense({...newExpense, expense_date: e.target.value})}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleAddExpense}
                      disabled={isAddingExpense}
                      className="flex-1"
                    >
                      {isAddingExpense ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        'Add Expense'
                      )}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setShowAddExpenseDialog(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* ✅ Current Filter Indicator */}
          {statusFilter !== 'all' && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-blue-900">
                      📊 Showing <strong className="capitalize">{statusFilter}</strong> orders only ({stats.totalOrders} orders, {formatPrice(stats.totalEarnings)} earned)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStatusFilter('all')}
                    className="text-blue-700 hover:text-blue-900"
                  >
                    Clear Filter
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm opacity-90">Total Orders</p>
                    <p className="text-2xl md:text-3xl font-bold mt-1">{stats.totalOrders}</p>
                  </div>
                  <Package className="h-8 w-8 md:h-10 md:w-10 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm opacity-90">Total Earnings</p>
                    <p className="text-xl md:text-2xl font-bold mt-1">{formatPrice(stats.totalEarnings)}</p>
                  </div>
                  <IndianRupee className="h-8 w-8 md:h-10 md:w-10 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm opacity-90">Total Expenses</p>
                    <p className="text-xl md:text-2xl font-bold mt-1">{formatPrice(totalExpenses)}</p>
                  </div>
                  <TrendingDown className="h-8 w-8 md:h-10 md:w-10 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className={`bg-gradient-to-br ${netProfit >= 0 ? 'from-emerald-500 to-emerald-600' : 'from-orange-500 to-orange-600'} text-white`}>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm opacity-90">Net Profit</p>
                    <p className="text-xl md:text-2xl font-bold mt-1">{formatPrice(netProfit)}</p>
                    <p className="text-xs opacity-75 mt-1">{profitMargin}% margin</p>
                  </div>
                  <TrendingUp className="h-8 w-8 md:h-10 md:w-10 opacity-80" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Method Breakdown */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  COD Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total COD</span>
                    <span className="text-2xl font-bold text-gray-900">{formatPrice(stats.codEarnings)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-orange-500 h-3 rounded-full transition-all"
                      style={{ 
                        width: `${stats.totalEarnings > 0 ? (stats.codEarnings / stats.totalEarnings) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    {stats.totalEarnings > 0 
                      ? ((stats.codEarnings / stats.totalEarnings) * 100).toFixed(1) 
                      : 0}% of total earnings
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Online Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Online</span>
                    <span className="text-2xl font-bold text-gray-900">{formatPrice(stats.onlineEarnings)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-500 h-3 rounded-full transition-all"
                      style={{ 
                        width: `${stats.totalEarnings > 0 ? (stats.onlineEarnings / stats.totalEarnings) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    {stats.totalEarnings > 0 
                      ? ((stats.onlineEarnings / stats.totalEarnings) * 100).toFixed(1) 
                      : 0}% of total earnings
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Monthly Earnings Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.monthlyData.map((month, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{month.month}</span>
                      <span className="font-bold">{formatPrice(month.total)}</span>
                    </div>
                    <div className="flex gap-1 h-8">
                      <div 
                        className="bg-orange-500 rounded flex items-center justify-center text-white text-xs font-medium"
                        style={{ width: `${month.total > 0 ? (month.cod / month.total) * 100 : 0}%` }}
                        title={`COD: ${formatPrice(month.cod)}`}
                      >
                        {month.cod > 0 && formatPrice(month.cod)}
                      </div>
                      <div 
                        className="bg-blue-500 rounded flex items-center justify-center text-white text-xs font-medium"
                        style={{ width: `${month.total > 0 ? (month.online / month.total) * 100 : 0}%` }}
                        title={`Online: ${formatPrice(month.online)}`}
                      >
                        {month.online > 0 && formatPrice(month.online)}
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-600">
                      <span>🟧 COD: {formatPrice(month.cod)}</span>
                      <span>🟦 Online: {formatPrice(month.online)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Expenses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Recent Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No expenses recorded yet</p>
                  <p className="text-sm mt-1">Click "Add Expense" to start tracking</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expenses.slice(0, 10).map((expense) => (
                    <div 
                      key={expense.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{expense.category}</p>
                        {expense.description && (
                          <p className="text-xs text-gray-600 mt-1">{expense.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(expense.expense_date).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-red-600">-{formatPrice(parseFloat(expense.amount.toString()))}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                        >
                          ×
                        </Button>
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
  );
}
