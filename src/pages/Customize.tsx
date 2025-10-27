import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShoppingCart, ArrowLeft, X } from 'lucide-react';
import { toast } from 'sonner';
import PrintOptions, { PrintJobOptions } from '@/components/print/PrintOptions';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import { CartItem } from '@/types';
import { calculateItemPrice } from '@/lib/pricing';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  pages?: number;
}

export default function Customize() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [printOptions, setPrintOptions] = useState<Record<string, PrintJobOptions>>({});
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const filesData = sessionStorage.getItem('uploadedFiles');
    if (filesData) {
      const files = JSON.parse(filesData);
      setUploadedFiles(files);
      
      const defaultOptions: Record<string, PrintJobOptions> = {};
      files.forEach((file: UploadedFile) => {
        defaultOptions[file.id] = {
          copies: 1,
          colorMode: 'bw',
          sides: 'single',
          paperSize: 'A4',
          spiralBinding: 0,
          recordBinding: 0,
          customPages: {
            bwPages: '',
            colorPages: ''
          }
        };
      });
      setPrintOptions(defaultOptions);
    } else {
      navigate('/upload');
    }
  }, [navigate]);

  const handleOptionsChange = (fileId: string, options: PrintJobOptions) => {
    setPrintOptions(prev => ({
      ...prev,
      [fileId]: options
    }));
  };

  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  const handleCancelConfirm = () => {
    sessionStorage.removeItem('uploadedFiles');
    toast.info('Order cancelled');
    navigate('/', { replace: true });
  };

  const handleCancelDecline = () => {
    setShowCancelDialog(false);
    navigate('/upload');
  };

  const addToCart = () => {
    try {
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
      
      const newCartItems: CartItem[] = uploadedFiles.map(file => {
        const options = printOptions[file.id];
        
        const cartItem: CartItem = {
          id: `cart-${Date.now()}-${file.id}`,
          document_name: file.name,
          document_url: file.url || '',
          total_pages: file.pages || 1,
          copies: options.copies,
          color_mode: options.colorMode,
          sides: options.sides,
          paper_size: options.paperSize,
          spiral_binding: options.spiralBinding,
          record_binding: options.recordBinding,
          price: 0,
          custom_pages_config: options.customPages // ✅ Use customPages from options
        };
        
        cartItem.price = calculateItemPrice(cartItem);
        
        return cartItem;
      });
      
      const updatedCart = [...existingCart, ...newCartItems];
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      
      sessionStorage.removeItem('uploadedFiles');
      
      toast.success(`${newCartItems.length} item(s) added to cart!`);
      navigate('/cart');
      
    } catch (error) {
      console.error('Failed to add items to cart:', error);
      toast.error('Failed to add items to cart');
    }
  };

  if (uploadedFiles.length === 0) {
    return null;
  }

  const currentFile = uploadedFiles[currentFileIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Header with Cancel */}
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="ghost" 
              onClick={handleCancel}
              className="flex items-center text-red-600 hover:text-red-700"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel Order
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Customize Print Options</h1>
            <div></div>
          </div>

          {/* File Navigation */}
          {uploadedFiles.length > 1 && (
            <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
              {uploadedFiles.map((file, index) => (
                <Button
                  key={file.id}
                  variant={index === currentFileIndex ? "default" : "outline"}
                  onClick={() => setCurrentFileIndex(index)}
                  className="whitespace-nowrap"
                >
                  {file.name}
                </Button>
              ))}
            </div>
          )}

          {/* Print Options */}
          <PrintOptions
            fileName={currentFile.name}
            totalPages={currentFile.pages || 1}
            initialOptions={printOptions[currentFile.id]}
            onOptionsChange={(options) => handleOptionsChange(currentFile.id, options)}
          />

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8">
            <div className="flex space-x-2">
              {currentFileIndex > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentFileIndex(currentFileIndex - 1)}
                >
                  Previous File
                </Button>
              )}
              {currentFileIndex < uploadedFiles.length - 1 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentFileIndex(currentFileIndex + 1)}
                >
                  Next File
                </Button>
              )}
            </div>

            <Button onClick={addToCart} size="lg" className="flex items-center">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart ({uploadedFiles.length} items)
            </Button>
          </div>
        </div>
      </main>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
            <AlertDialogDescription>
              Do you want to cancel this order? Your uploaded files will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDecline}>
              No, Upload More Files
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelConfirm} className="bg-red-600 hover:bg-red-700">
              Yes, Cancel Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MobileNav />
    </div>
  );
}
