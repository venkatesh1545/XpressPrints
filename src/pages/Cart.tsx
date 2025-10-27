import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, Trash2, CreditCard, Banknote, Upload } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import { CartItem } from '@/types';
import { calculateCartTotal, formatPrice } from '@/lib/pricing';

const CONVENIENCE_FEE = 4; // ₹4 convenience fee

export default function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const items = JSON.parse(savedCart);
      setCartItems(items);
      setSelectedItems(new Set(items.map((item: CartItem) => item.id)));
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(cartItems.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleRemoveItem = (itemId: string) => {
    const updatedCart = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
    
    toast.success('Item removed from cart');
  };

  const handleEditItem = (item: CartItem) => {
    const fileData = {
      id: item.id,
      name: item.document_name,
      size: 0,
      type: 'application/pdf',
      url: item.document_url,
      pages: item.total_pages,
      status: 'success' as const
    };
    
    sessionStorage.setItem('uploadedFiles', JSON.stringify([fileData]));
    sessionStorage.setItem('editingItemId', item.id);
    
    navigate('/customize');
  };

  const handleUploadMore = () => {
    navigate('/upload');
  };

  const handleCheckout = (paymentMethod: 'online' | 'cod') => {
    if (selectedItems.size === 0) {
      toast.error('Please select at least one item to proceed');
      return;
    }

    const selectedCartItems = cartItems.filter(item => selectedItems.has(item.id));
    
    sessionStorage.setItem('checkoutItems', JSON.stringify(selectedCartItems));
    sessionStorage.setItem('paymentMethod', paymentMethod);
    
    navigate('/order-confirmation');
  };

  const updateQuantity = (itemId: string, delta: number) => {
    const updatedCart = cartItems.map(item => {
      if (item.id === itemId) {
        const newCopies = Math.max(1, item.copies + delta);
        return { ...item, copies: newCopies };
      }
      return item;
    });
    
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const selectedCartItems = cartItems.filter(item => selectedItems.has(item.id));
  const subtotal = calculateCartTotal(selectedCartItems);
  const totalWithFee = subtotal + CONVENIENCE_FEE;
  const allSelected = cartItems.length > 0 && selectedItems.size === cartItems.length;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <p className="text-gray-600 mb-4">Your cart is empty</p>
              <Button onClick={() => navigate('/upload')}>
                Start Uploading
              </Button>
            </CardContent>
          </Card>
        </main>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="flex items-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continue Shopping
            </Button>
            
            <h1 className="text-2xl font-bold">Shopping Cart</h1>
            
            <Button 
              variant="outline" 
              onClick={handleUploadMore}
              className="flex items-center"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload More Files
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all"
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                    />
                    <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                      Select All ({cartItems.length} items)
                    </label>
                  </div>
                </CardContent>
              </Card>

              {cartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={`item-${item.id}`}
                        checked={selectedItems.has(item.id)}
                        onCheckedChange={(checked) => handleSelectItem(item.id, !!checked)}
                        className="mt-1"
                      />

                      <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                        </svg>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {item.document_name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.total_pages} pages • {item.paper_size}
                        </p>
                        
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span className="px-2 py-1 bg-gray-100 rounded">
                            {item.color_mode === 'bw' ? 'Black & White' : 
                             item.color_mode === 'color' ? 'Color' : 'Custom'}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 rounded">
                            {item.sides === 'single' ? 'Single Side' : 'Both Sides'}
                          </span>
                        </div>

                        <div className="flex items-center space-x-3 mt-3">
                          <span className="text-sm text-gray-600">Copies:</span>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, -1)}
                              disabled={item.copies <= 1}
                            >
                              -
                            </Button>
                            <span className="w-8 text-center font-medium">{item.copies}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, 1)}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end space-y-2">
                        <p className="text-lg font-bold text-gray-900">
                          {formatPrice(item.price * item.copies)}
                        </p>
                        
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditItem(item)}
                            className="h-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                            className="h-8 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Items ({selectedItems.size})</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery</span>
                    <span className="text-green-600 font-medium">Free</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Convenience Fee</span>
                    <span className="font-medium">{formatPrice(CONVENIENCE_FEE)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between">
                    <span className="font-medium">Total</span>
                    <span className="text-xl font-bold">{formatPrice(totalWithFee)}</span>
                  </div>

                  <div className="space-y-2 pt-4">
                    <Button 
                      onClick={() => handleCheckout('online')}
                      className="w-full"
                      size="lg"
                      disabled={selectedItems.size === 0}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pay Online
                    </Button>
                    
                    <Button 
                      onClick={() => handleCheckout('cod')}
                      variant="outline"
                      className="w-full"
                      size="lg"
                      disabled={selectedItems.size === 0}
                    >
                      <Banknote className="mr-2 h-4 w-4" />
                      Cash on Delivery
                    </Button>
                  </div>

                  <p className="text-xs text-gray-500 text-center mt-4">
                    Free delivery within 2 hours. Cash on delivery available.
                  </p>
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
