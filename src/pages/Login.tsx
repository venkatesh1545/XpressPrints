import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useState } from 'react';
import AuthForm from '@/components/auth/AuthForm';
import { supabase } from '@/lib/supabase';
import { Printer } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (data: { email: string; password: string }) => {
    setIsLoading(true);
    
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (error) throw error;

      if (authData.user) {
        // Check if account was scheduled for deletion
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('deletion_scheduled_at')
          .eq('id', authData.user.id)
          .single();

        if (!profileError && profile?.deletion_scheduled_at) {
          // Restore account by clearing deletion flags
          const { error: restoreError } = await supabase
            .from('profiles')
            .update({
              deletion_scheduled_at: null,
              deleted_at: null
            })
            .eq('id', authData.user.id);

          if (!restoreError) {
            toast.success('Welcome back! Your account has been restored.');
          }
        } else {
          toast.success('Welcome back!');
        }
      }

      navigate('/dashboard');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Printer className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Xpress Prints</h1>
          <p className="text-gray-600 mt-2">Welcome back! Sign in to continue</p>
        </div>

        {/* Login Form */}
        <AuthForm mode="login" onSubmit={handleLogin} />
        
        {/* Forgot Password Link */}
        <div className="text-center mt-4">
          <Link 
            to="/forgot-password" 
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            Forgot your password?
          </Link>
        </div>

        {/* Sign Up Link */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
