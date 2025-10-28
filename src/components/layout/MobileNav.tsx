import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Upload, ShoppingCart, FileText, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface MobileNavProps {
  cartItemsCount?: number;
}

export default function MobileNav({ cartItemsCount = 0 }: MobileNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
  };

  const handleNavClick = async (path: string, requiresAuth: boolean) => {
    if (requiresAuth) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
    }
    navigate(path);
  };

  const navItems = [
    { 
      path: '/', 
      icon: Home, 
      label: 'Home',
      requiresAuth: false,
      onClick: () => {
        // Navigate to dashboard if logged in, landing page if not
        if (isAuthenticated) {
          navigate('/dashboard');
        } else {
          navigate('/');
        }
      }
    },
    { 
      path: '/upload', 
      icon: Upload, 
      label: 'Upload',
      requiresAuth: true,
      onClick: () => handleNavClick('/upload', true)
    },
    { 
      path: '/cart', 
      icon: ShoppingCart, 
      label: 'Cart', 
      badge: cartItemsCount,
      requiresAuth: false,
      onClick: () => navigate('/cart')
    },
    { 
      path: '/my-orders', 
      icon: FileText, 
      label: 'Orders',
      requiresAuth: true,
      onClick: () => handleNavClick('/my-orders', true)
    },
    { 
      path: '/profile', 
      icon: User, 
      label: 'Profile',
      requiresAuth: true,
      onClick: () => handleNavClick('/profile', true)
    },
  ];

  // Don't show mobile nav if user is not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex items-center justify-around py-1.5">
        {navItems.map(({ path, icon: Icon, label, badge, onClick }) => {
          const isActive = location.pathname === path || 
            (path === '/' && (location.pathname === '/dashboard' || location.pathname === '/'));
          
          return (
            <button
              key={path}
              onClick={onClick}
              className={`flex flex-col items-center py-1.5 px-2 rounded-lg transition-colors min-w-[60px] ${
                isActive 
                  ? 'text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {badge !== undefined && badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 bg-blue-600 text-white text-[10px] font-medium rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
