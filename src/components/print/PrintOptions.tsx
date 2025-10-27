import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Minus, Plus, Info } from 'lucide-react';
import { calculateItemPrice, formatPrice, getTierInfo } from '@/lib/pricing';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PrintOptionsProps {
  fileName: string;
  totalPages: number;
  initialOptions?: PrintJobOptions;
  onOptionsChange: (options: PrintJobOptions) => void;
}

export interface PrintJobOptions {
  copies: number;
  colorMode: 'bw' | 'color' | 'custom';
  sides: 'single' | 'double';
  paperSize: string;
  spiralBinding: number;
  recordBinding: number;
  customPages?: {
    bwPages: string;
    colorPages: string;
  };
}

export default function PrintOptions({ fileName, totalPages, initialOptions, onOptionsChange }: PrintOptionsProps) {
  const [options, setOptions] = useState<PrintJobOptions>(initialOptions || {
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
  });

  // Update options when initialOptions changes (when switching between files)
  useEffect(() => {
    if (initialOptions) {
      setOptions(initialOptions);
    }
  }, [initialOptions]);

  const updateOptions = (newOptions: Partial<PrintJobOptions>) => {
    const updated = { ...options, ...newOptions };
    setOptions(updated);
    onOptionsChange(updated);
  };

  const adjustCopies = (delta: number) => {
    const newCopies = Math.max(1, options.copies + delta);
    updateOptions({ copies: newCopies });
  };

  const adjustBinding = (type: 'spiral' | 'record', delta: number) => {
    const key = type === 'spiral' ? 'spiralBinding' : 'recordBinding';
    const newValue = Math.max(0, options[key] + delta);
    updateOptions({ [key]: newValue });
  };

  const handleCustomPagesChange = (type: 'bwPages' | 'colorPages', value: string) => {
    updateOptions({
      customPages: {
        ...options.customPages,
        bwPages: options.customPages?.bwPages || '',
        colorPages: options.customPages?.colorPages || '',
        [type]: value
      }
    });
  };

  const parsePageNumbers = (input: string, maxPages: number): number[] => {
    if (!input.trim()) return [];
    
    const pages = new Set<number>();
    const parts = input.split(',').map(p => p.trim());
    
    for (const part of parts) {
      if (part === '0') continue;
      
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        if (start && end && start <= end) {
          for (let i = start; i <= Math.min(end, maxPages); i++) {
            pages.add(i);
          }
        }
      } else {
        const page = Number(part);
        if (page >= 1 && page <= maxPages) {
          pages.add(page);
        }
      }
    }
    
    return Array.from(pages).sort((a, b) => a - b);
  };

  const getCustomPageCount = () => {
    const bwPages = parsePageNumbers(options.customPages?.bwPages || '', totalPages);
    const colorPages = parsePageNumbers(options.customPages?.colorPages || '', totalPages);
    
    return {
      bwCount: bwPages.length,
      colorCount: colorPages.length,
      total: bwPages.length + colorPages.length
    };
  };

  const customPageCount = options.colorMode === 'custom' ? getCustomPageCount() : null;

  // Calculate effective pages for pricing
  const getEffectivePagesForPricing = () => {
    if (options.colorMode === 'custom' && customPageCount) {
      return customPageCount.total * options.copies;
    }
    return totalPages * options.copies;
  };

  const effectivePages = getEffectivePagesForPricing();
  const tierInfo = getTierInfo(effectivePages);

  // Calculate prices based on effective page count
  const getBWPricePerPage = () => {
    const pages = options.colorMode === 'custom' && customPageCount 
      ? customPageCount.bwCount * options.copies 
      : effectivePages;
    return pages >= 40 ? '1.5' : '2';
  };

  const getDoubleSidePricePerPage = () => {
    const pages = options.colorMode === 'custom' && customPageCount 
      ? customPageCount.bwCount * options.copies 
      : effectivePages;
    return pages >= 40 ? '2.5' : '3';
  };

  const currentPrice = calculateItemPrice({
    id: 'preview',
    document_name: fileName,
    document_url: '',
    total_pages: totalPages,
    copies: options.copies,
    color_mode: options.colorMode,
    sides: options.sides,
    paper_size: options.paperSize,
    spiral_binding: options.spiralBinding,
    record_binding: options.recordBinding,
    price: 0,
    custom_pages_config: options.customPages
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{fileName}</CardTitle>
              <p className="text-sm text-gray-600">{totalPages} pages</p>
            </div>
            {tierInfo.message && (
              <Badge variant={tierInfo.tier === 'bulk' ? 'default' : 'secondary'}>
                {tierInfo.message}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Number of Copies */}
          <div>
            <Label className="text-base font-medium">Number of Copies</Label>
            <div className="flex items-center space-x-3 mt-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustCopies(-1)}
                disabled={options.copies <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                value={options.copies}
                onChange={(e) => updateOptions({ copies: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-20 text-center"
                min="1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustCopies(1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Color Options */}
          <div>
            <Label className="text-base font-medium">Color Options</Label>
            <RadioGroup
              value={options.colorMode}
              onValueChange={(value: 'bw' | 'color' | 'custom') => updateOptions({ colorMode: value })}
              className="mt-2 space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bw" id="bw" />
                <Label htmlFor="bw" className="cursor-pointer">
                  Black & White (₹{effectivePages >= 40 ? '1.5' : '2'}/page)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="color" id="color" />
                <Label htmlFor="color" className="cursor-pointer">
                  Full Color (₹10/page)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="cursor-pointer">
                  Custom (Page-by-page selection)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Custom Page Selection */}
          {options.colorMode === 'custom' && (
            <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">How to specify pages:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Single pages: <code className="bg-white px-1 rounded">1, 5, 10</code></li>
                    <li>Page ranges: <code className="bg-white px-1 rounded">2-20, 25-30</code></li>
                    <li>Combined: <code className="bg-white px-1 rounded">1, 5-10, 15, 20-25</code></li>
                    <li>Enter <code className="bg-white px-1 rounded">0</code> if not needed</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="bw-pages" className="text-sm font-medium">
                    B&W Pages (₹{getBWPricePerPage()}/page)
                  </Label>
                  <Input
                    id="bw-pages"
                    type="text"
                    placeholder="e.g., 3, 5-108"
                    value={options.customPages?.bwPages || ''}
                    onChange={(e) => handleCustomPagesChange('bwPages', e.target.value)}
                    className="mt-1"
                  />
                  {customPageCount && customPageCount.bwCount > 0 && (
                    <p className="text-xs text-gray-600 mt-1">
                      {customPageCount.bwCount} pages selected
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="color-pages" className="text-sm font-medium">
                    Color Pages (₹10/page)
                  </Label>
                  <Input
                    id="color-pages"
                    type="text"
                    placeholder="e.g., 1, 2, 4"
                    value={options.customPages?.colorPages || ''}
                    onChange={(e) => handleCustomPagesChange('colorPages', e.target.value)}
                    className="mt-1"
                  />
                  {customPageCount && customPageCount.colorCount > 0 && (
                    <p className="text-xs text-gray-600 mt-1">
                      {customPageCount.colorCount} pages selected
                    </p>
                  )}
                </div>
              </div>

              {customPageCount && customPageCount.total > 0 && (
                <Alert>
                  <AlertDescription className="text-sm">
                    <strong>Total:</strong> {customPageCount.bwCount} B&W pages + {customPageCount.colorCount} color pages = {customPageCount.total} pages
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Sides */}
          <div>
            <Label className="text-base font-medium">Printing Sides</Label>
            <RadioGroup
              value={options.sides}
              onValueChange={(value: 'single' | 'double') => updateOptions({ sides: value })}
              className="mt-2 space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single" className="cursor-pointer">
                  Single Side (₹{getBWPricePerPage()}/page)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="double" id="double" />
                <Label htmlFor="double" className="cursor-pointer">
                  Both Sides (₹{getDoubleSidePricePerPage()}/page)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Paper Size */}
          <div>
            <Label className="text-base font-medium">Paper Size</Label>
            <Select value={options.paperSize} onValueChange={(value) => updateOptions({ paperSize: value })}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
                <SelectItem value="Letter">Letter (8.5 × 11 in)</SelectItem>
                <SelectItem value="Legal">Legal (8.5 × 14 in)</SelectItem>
                <SelectItem value="A3">A3 (297 × 420 mm)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Binding Options */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Binding Options</Label>
            
            <div className="flex items-center justify-between p-3 border rounded-lg hover:border-blue-500 transition-colors">
              <div>
                <Label className="font-medium">Spiral Binding</Label>
                <p className="text-xs text-gray-500">₹30 per copy</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustBinding('spiral', -1)}
                  disabled={options.spiralBinding <= 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-medium">{options.spiralBinding}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustBinding('spiral', 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg hover:border-blue-500 transition-colors">
              <div>
                <Label className="font-medium">Record Binding</Label>
                <p className="text-xs text-gray-500">₹40 per copy</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustBinding('record', -1)}
                  disabled={options.recordBinding <= 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-medium">{options.recordBinding}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustBinding('record', 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Price Display */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Total Price:</span>
              <span className="text-2xl font-bold text-blue-600">{formatPrice(currentPrice)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
