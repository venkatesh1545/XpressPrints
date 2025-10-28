import { CartItem } from '@/types';

export const PRICING = {
  blackAndWhite: {
    lessThan40: { single: 2, double: 3 },
    fortyOrMore: { single: 1.5, double: 2.5 }
  },
  color: { single: 10, double: 15 },
  spiralBinding: 30,
  recordBinding: 40
};

export const getBlackAndWhitePrice = (totalPages: number, sides: 'single' | 'double'): number => {
  if (totalPages >= 40) {
    return sides === 'single' ? PRICING.blackAndWhite.fortyOrMore.single : PRICING.blackAndWhite.fortyOrMore.double;
  }
  return sides === 'single' ? PRICING.blackAndWhite.lessThan40.single : PRICING.blackAndWhite.lessThan40.double;
};

const parsePageNumbers = (input: string, maxPages: number): number[] => {
  if (!input || !input.trim()) return [];
  
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
  
  return Array.from(pages);
};

// ✅ FIXED: Calculate price per item, then multiply by copies
export const calculateItemPrice = (item: CartItem): number => {
  let pricePerCopy = 0;
  
  // ✅ Type assertion to ensure sides is correct type
  const sides = item.sides as 'single' | 'double';
  
  if (item.color_mode === 'bw') {
    // ✅ FIXED: Calculate price for ONE copy, then multiply
    const pricePerPage = getBlackAndWhitePrice(item.total_pages, sides);
    pricePerCopy = item.total_pages * pricePerPage;
    
  } else if (item.color_mode === 'color') {
    // ✅ FIXED: Calculate price for ONE copy, then multiply
    const colorPrice = sides === 'single' ? PRICING.color.single : PRICING.color.double;
    pricePerCopy = item.total_pages * colorPrice;
    
  } else if (item.color_mode === 'custom' && item.custom_pages_config) {
    const bwPages = parsePageNumbers(item.custom_pages_config.bwPages || '', item.total_pages);
    const colorPages = parsePageNumbers(item.custom_pages_config.colorPages || '', item.total_pages);
    
    // ✅ FIXED: Don't multiply by copies here
    const bwCount = bwPages.length;
    const colorCount = colorPages.length;
    
    const bwPrice = getBlackAndWhitePrice(bwCount, sides);
    const colorPrice = sides === 'single' ? PRICING.color.single : PRICING.color.double;
    
    pricePerCopy = (bwCount * bwPrice) + (colorCount * colorPrice);
  }
  
  // ✅ Calculate total price = price per copy × number of copies
  let totalPrice = pricePerCopy * item.copies;
  
  // ✅ Add binding costs (these don't multiply by copies)
  if (item.spiral_binding && item.spiral_binding > 0) {
    totalPrice += item.spiral_binding * PRICING.spiralBinding;
  }
  
  if (item.record_binding && item.record_binding > 0) {
    totalPrice += item.record_binding * PRICING.recordBinding;
  }
  
  return Math.round(totalPrice * 100) / 100;
};

export const calculateCartTotal = (items: CartItem[]): number => {
  const total = items.reduce((sum, item) => sum + calculateItemPrice(item), 0);
  return Math.round(total * 100) / 100;
};

export const formatPrice = (amount: number): string => {
  return `₹${amount.toFixed(2)}`;
};

export const getTierInfo = (totalPages: number): {
  tier: 'standard' | 'bulk';
  message: string;
} => {
  if (totalPages >= 40) {
    return { tier: 'bulk', message: '🎉 Bulk discount applied! (40+ pages)' };
  }
  return {
    tier: 'standard',
    message: totalPages >= 30 ? '💡 Tip: 40+ pages get bulk discount rates!' : ''
  };
};
