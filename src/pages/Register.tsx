import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import AuthForm from '@/components/auth/AuthForm';
import { supabase } from '@/lib/supabase';
import { Printer } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();

  const handleRegister = async (data: { 
    email: string; 
    password: string; 
    fullName: string; 
    phoneNumber?: string 
  }) => {
    try {
      // Sign up with Supabase
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phoneNumber || ''
          }
        }
      });

      if (signUpError) {
        // Handle specific error messages
        if (signUpError.message.includes('already registered') || 
            signUpError.message.includes('already exists') ||
            signUpError.message.includes('User already registered')) {
          toast.error('This email is already registered. Please use a different email or sign in.');
          return;
        }
        throw signUpError;
      }

      if (!authData.user) {
        throw new Error('Signup failed - no user returned');
      }

      // The trigger will automatically create the profile in the database
      // But we can also manually insert to ensure it exists
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: data.email,
          full_name: data.fullName,
          phone: data.phoneNumber || '',
          role: 'customer'
        })
        .select()
        .single();

      // Ignore duplicate errors since trigger might have already created it
      if (profileError && !profileError.message.includes('duplicate')) {
        console.error('Profile creation error:', profileError);
      }

      toast.success('Account created successfully!');
      toast.info('Please check your email to verify your account.');
      navigate('/login');
    } catch (error: unknown) {
      console.error('Registration error:', error);
      
      if (error instanceof Error) {
        // Check for common Supabase error messages
        if (error.message.includes('already registered') || 
            error.message.includes('already exists')) {
          toast.error('This email is already registered. Please use a different email.');
        } else if (error.message.includes('password')) {
          toast.error('Password must be at least 6 characters long.');
        } else if (error.message.includes('email')) {
          toast.error('Please enter a valid email address.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('Failed to create account. Please try again.');
      }
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
          <p className="text-gray-600 mt-2">Create your account to get started</p>
        </div>

        {/* Registration Form */}
        <AuthForm mode="register" onSubmit={handleRegister} />
        
        {/* Sign In Link */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
