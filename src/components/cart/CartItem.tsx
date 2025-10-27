import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, FileText, Minus, Plus } from 'lucide-react';
import { CartItem as CartItemType } from '@/types';
import { calculateItemPrice, formatPrice } from '@/lib/pricing';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (id: string, copies: number) => void;
  onRemove: (id: string) => void;
}

export default function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const [copies, setCopies] = useState(item.copies);

  const handleQuantityChange = (newCopies: number) => {
    const validCopies = Math.max(1, newCopies);
    setCopies(validCopies);
    onUpdateQuantity(item.id, validCopies);
  };

  const itemPrice = calculateItemPrice(item);

  const getColorModeLabel = (mode: string) => {
    switch (mode) {
      case 'bw': return 'Black & White';
      case 'color': return 'Color';
      case 'custom': return 'Custom';
      default: return mode;
    }
  };

  const getSidesLabel = (sides: string) => {
    return sides === 'single' ? 'Single Side' : 'Both Sides';
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-900 truncate">{item.document_name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {item.total_pages} pages • {item.paper_size}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(item.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary">{getColorModeLabel(item.color_mode)}</Badge>
              <Badge variant="secondary">{getSidesLabel(item.sides)}</Badge>
              {item.line_graph_sheets > 0 && (
                <Badge variant="outline">Line Graph: {item.line_graph_sheets}</Badge>
              )}
              {item.semi_log_graph_sheets > 0 && (
                <Badge variant="outline">Semi-Log: {item.semi_log_graph_sheets}</Badge>
              )}
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Copies:</span>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(copies - 1)}
                    disabled={copies <= 1}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    value={copies}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                    className="w-16 h-8 text-center"
                    min="1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(copies + 1)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">
                  {formatPrice(itemPrice)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}