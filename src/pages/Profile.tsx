import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Trash2, 
  Save,
  Loader2,
  FileText,
  Shield,
  Truck,
  DollarSign,
  MessageSquare,
  KeyRound
} from 'lucide-react';

export default function Profile() {
  const [user, setUser] = useState({
    full_name: '',
    email: '',
    phone: ''
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
  }, []);

  // Load user data from profiles table
  const loadUserData = async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        navigate('/login');
        return;
      }

      // Get from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        // Fallback to auth metadata
        setUser({
          full_name: authUser.user_metadata?.full_name || '',
          email: authUser.email || '',
          phone: authUser.user_metadata?.phone || ''
        });
      } else {
        setUser({
          full_name: profile.full_name || '',
          email: authUser.email || '',
          phone: profile.phone || ''
        });
      }
    } catch (error) {
      console.error('Error loading user:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Update profile in both places
  const handleUpdateProfile = async () => {
    setSaving(true);
    
    try {
      const { data: { user: authUser }, error: getUserError } = await supabase.auth.getUser();
      
      if (getUserError || !authUser) {
        throw new Error('Not authenticated');
      }

      // 1. Update auth.users metadata (for consistency)
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: user.full_name,
          phone: user.phone
        }
      });

      if (authError) throw authError;

      // 2. Update profiles table (main storage)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: user.full_name,
          phone: user.phone,
        })
        .eq('id', authUser.id);

      if (profileError) throw profileError;

      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Send password reset email with OTP
  const handleChangePassword = async () => {
    setSendingResetEmail(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success('Password reset email sent! Check your inbox.');
      toast.info('Click the link in your email to reset your password.');
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error('Failed to send reset email');
    } finally {
      setSendingResetEmail(false);
    }
  };

  const handleDeleteAccount = async () => {
        if (deleteConfirmation !== 'delete account') {
            toast.error('Please type "delete account" exactly');
            return;
        }

        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            
            if (!authUser) {
            throw new Error('Not authenticated');
            }

            // Mark account for deletion (soft delete)
            const { error: profileError } = await supabase
            .from('profiles')
            .update({
                deletion_scheduled_at: new Date().toISOString(),
                deleted_at: new Date().toISOString()
            })
            .eq('id', authUser.id);

            if (profileError) throw profileError;

            // Sign out the user
            await supabase.auth.signOut();
            
            toast.success('Account scheduled for deletion');
            toast.info('Your account will be permanently deleted in 2 days. Sign in within 2 days to restore it.');
            
            navigate('/');
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to process request');
        } finally {
            setShowDeleteDialog(false);
            setDeleteConfirmation('');
        }
    };


  const quickLinks = [
    { label: 'Terms & Conditions', path: '/terms-and-conditions', icon: FileText },
    { label: 'Privacy Policy', path: '/privacy-policy', icon: Shield },
    { label: 'Shipping Policy', path: '/shipping-policy', icon: Truck },
    { label: 'Refund Policy', path: '/refund-policy', icon: DollarSign },
    { label: 'Contact Us', path: '/contact-us', icon: MessageSquare },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">My Profile</h1>

          <div className="space-y-6">
            {/* Personal Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Personal Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="full_name"
                      value={user.full_name}
                      onChange={(e) => setUser({ ...user, full_name: e.target.value })}
                      className="pl-10"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      value={user.email}
                      disabled
                      className="pl-10 bg-gray-50"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={user.phone}
                      onChange={(e) => setUser({ ...user, phone: e.target.value })}
                      className="pl-10"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                <Button onClick={handleUpdateProfile} disabled={saving} className="w-full">
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Change Password - Simplified */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="mr-2 h-5 w-5" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  To change your password, we'll send a secure reset link to your email address. Click the link to verify your identity and set a new password.
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <KeyRound className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Secure Password Reset</p>
                      <p>We'll email you a verification link to: <strong>{user.email}</strong></p>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleChangePassword} 
                  disabled={sendingResetEmail} 
                  className="w-full" 
                  variant="secondary"
                >
                  {sendingResetEmail ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Email...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Password Reset Email
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Help & Support</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickLinks.map((link, index) => (
                  <button
                    key={index}
                    onClick={() => navigate(link.path)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center">
                      <link.icon className="h-5 w-5 text-gray-600 mr-3" />
                      <span className="text-gray-700">{link.label}</span>
                    </div>
                    <span className="text-gray-400">→</span>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Delete Account */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center text-red-600">
                  <Trash2 className="mr-2 h-5 w-5" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteDialog(true)}
                  className="w-full"
                >
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-red-600">
                <Trash2 className="mr-2 h-5 w-5" />
                Delete Account Permanently?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
                <p className="font-medium text-gray-900">
                This action will schedule your account for permanent deletion.
                </p>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                <p className="text-sm text-red-800 font-medium">⚠️ What will be deleted:</p>
                <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                    <li>Your profile information</li>
                    <li>All order history</li>
                    <li>Dashboard data</li>
                    <li>Uploaded documents</li>
                    <li>Everything permanently</li>
                </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                    <strong>Grace Period:</strong> Your account will be permanently deleted in <strong>2 days</strong>.
                </p>
                <p className="text-sm text-blue-800 mt-2">
                    💡 <strong>Changed your mind?</strong> Sign in within 2 days and your account will be automatically restored.
                </p>
                </div>

                <p className="text-sm text-gray-600 font-medium pt-2">
                Type <strong>"delete account"</strong> below to confirm:
                </p>
            </AlertDialogDescription>
            </AlertDialogHeader>
            
            <Input
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            placeholder="Type: delete account"
            className="my-4"
            />
            
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>
                Cancel
            </AlertDialogCancel>
            <AlertDialogAction
                onClick={handleDeleteAccount}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteConfirmation !== 'delete account'}
            >
                Yes, Delete My Account
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
        </AlertDialog>


      <MobileNav />
    </div>
  );
}
