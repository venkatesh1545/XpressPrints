import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { GuestDetails } from '@/types';

interface GuestCheckoutModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (details: GuestDetails) => void;
  isLoading?: boolean;
}

export default function GuestCheckoutModal({ open, onClose, onSubmit, isLoading }: GuestCheckoutModalProps) {
  const [formData, setFormData] = useState<GuestDetails>({
    name: '',
    phone: '',
    email: '',
    createAccount: false,
    password: '' // ✅ Add password field
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Enter valid 10-digit phone number';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter valid email address';
    }

    // ✅ Validate password if user wants to create account
    if (formData.createAccount) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  // ✅ Handle checkbox toggle
  const handleCreateAccountToggle = (checked: boolean) => {
    setFormData({ 
      ...formData, 
      createAccount: checked,
      password: checked ? formData.password : '' // Clear password if unchecked
    });
    // Clear password error when unchecking
    if (!checked && errors.password) {
      const newErrors = { ...errors };
      delete newErrors.password;
      setErrors(newErrors);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            Complete Your Order
          </DialogTitle>
          <DialogDescription>
            Enter your details to place the order. No account needed!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <Label htmlFor="guest-name">Full Name *</Label>
            <Input
              id="guest-name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              className={errors.name ? 'border-red-500' : ''}
              disabled={isLoading}
            />
            {errors.name && (
              <div className="flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3 text-red-600" />
                <p className="text-xs text-red-600">{errors.name}</p>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="guest-phone">Phone Number *</Label>
            <Input
              id="guest-phone"
              type="tel"
              placeholder="Enter 10-digit number"
              value={formData.phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                setFormData({ ...formData, phone: value });
                if (errors.phone) setErrors({ ...errors, phone: '' });
              }}
              className={errors.phone ? 'border-red-500' : ''}
              disabled={isLoading}
            />
            {errors.phone && (
              <div className="flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3 text-red-600" />
                <p className="text-xs text-red-600">{errors.phone}</p>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="guest-email">Email Address *</Label>
            <Input
              id="guest-email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              className={errors.email ? 'border-red-500' : ''}
              disabled={isLoading}
            />
            {errors.email && (
              <div className="flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3 text-red-600" />
                <p className="text-xs text-red-600">{errors.email}</p>
              </div>
            )}
          </div>

          {/* ✅ Create account checkbox */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="create-account"
                checked={formData.createAccount}
                onCheckedChange={handleCreateAccountToggle}
                disabled={isLoading}
              />
              <div className="flex-1">
                <label
                  htmlFor="create-account"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Create account after order
                </label>
                <p className="text-xs text-gray-600 mt-1">
                  Track orders easily with a free account
                </p>
              </div>
            </div>

            {/* ✅ Password field appears when checkbox is checked */}
            {formData.createAccount && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <Label htmlFor="guest-password" className="text-xs">
                  Set Password *
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="guest-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password (min 6 characters)"
                    value={formData.password || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (errors.password) setErrors({ ...errors, password: '' });
                    }}
                    className={`pr-10 ${errors.password ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3 text-red-600" />
                    <p className="text-xs text-red-600">{errors.password}</p>
                  </div>
                )}
                <p className="text-xs text-blue-700 mt-2">
                  ✅ Account will be created after order is placed
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Continue to Payment'}
            </Button>
          </div>
        </form>

        <p className="text-xs text-center text-gray-500 mt-4">
          🔒 Your information is secure and will only be used for order processing
        </p>
      </DialogContent>
    </Dialog>
  );
}
