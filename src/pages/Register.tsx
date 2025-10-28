import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import AuthForm from '@/components/auth/AuthForm';
import { signUp } from '@/lib/auth';
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
      await signUp(data.email, data.password, data.fullName, data.phoneNumber);
      toast.success('Account created successfully! Please check your email to verify your account.');
      navigate('/login');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create account';
      throw new Error(errorMessage);
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
          {/* <p className="text-gray-600 mt-2">Welcome back! Sign in to continue</p> */}
        </div>
        <AuthForm mode="register" onSubmit={handleRegister} />
        
        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
