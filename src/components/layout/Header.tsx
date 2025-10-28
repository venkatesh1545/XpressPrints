import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ShoppingCart, User, LogOut, FileText } from 'lucide-react';
import { getCurrentUser, signOut } from '@/lib/auth';
import { User as UserType } from '@/types';

interface HeaderProps {
  cartItemsCount?: number;
}

export default function Header({ cartItemsCount = 0 }: HeaderProps) {
  const [user, setUser] = useState<UserType | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <FileText className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">XpressPrints</span>
        </Link>

        {/* <nav className="hidden md:flex items-center space-x-6">
          <Link to="/upload" className="text-gray-600 hover:text-gray-900 transition-colors">
            Upload
          </Link>
          <Link to="/orders" className="text-gray-600 hover:text-gray-900 transition-colors">
            Orders
          </Link>
        </nav> */}

        <div className="flex items-center space-x-4">
          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Button>
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user.full_name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                  <User className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/my-orders')}>
                  <FileText className="mr-2 h-4 w-4" />
                  Orders
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex space-x-2">
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Sign in
              </Button>
              <Button onClick={() => navigate('/register')}>
                Sign up
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}