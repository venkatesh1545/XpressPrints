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
    if (part === '0') continue; // Skip if user enters 0
    
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

export const calculateItemPrice = (item: CartItem): number => {
  let price = 0;
  
  const sides = item.sides;
  
  if (item.color_mode === 'bw') {
    const totalPages = item.total_pages * item.copies;
    const pricePerPage = getBlackAndWhitePrice(totalPages, sides);
    price = totalPages * pricePerPage;
    
  } else if (item.color_mode === 'color') {
    const totalPages = item.total_pages * item.copies;
    const colorPrice = sides === 'single' ? PRICING.color.single : PRICING.color.double;
    price = totalPages * colorPrice;
    
  } else if (item.color_mode === 'custom' && item.custom_pages_config) {
    const bwPages = parsePageNumbers(item.custom_pages_config.bwPages || '', item.total_pages);
    const colorPages = parsePageNumbers(item.custom_pages_config.colorPages || '', item.total_pages);
    
    const bwCount = bwPages.length * item.copies;
    const colorCount = colorPages.length * item.copies;
    
    const bwPrice = getBlackAndWhitePrice(bwCount, sides);
    const colorPrice = sides === 'single' ? PRICING.color.single : PRICING.color.double;
    
    price = (bwCount * bwPrice) + (colorCount * colorPrice);
  }
  
  if (item.spiral_binding && item.spiral_binding > 0) {
    price += item.spiral_binding * PRICING.spiralBinding;
  }
  
  if (item.record_binding && item.record_binding > 0) {
    price += item.record_binding * PRICING.recordBinding;
  }
  
  return Math.round(price * 100) / 100;
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
