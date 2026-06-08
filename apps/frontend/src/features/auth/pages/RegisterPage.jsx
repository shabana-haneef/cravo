import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '../schemas/auth.schemas.js';
import { useRegister } from '../hooks/useAuthQueries.js';
import { Input } from '../../../components/ui/Input.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, Store, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const getStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  return score; // 0 to 4
};

const PasswordStrengthMeter = ({ strength }) => {
  const getColors = () => {
    switch (strength) {
      case 0: return ['bg-gray-200', 'bg-gray-200', 'bg-gray-200', 'bg-gray-200'];
      case 1: return ['bg-red-500', 'bg-gray-200', 'bg-gray-200', 'bg-gray-200'];
      case 2: return ['bg-yellow-500', 'bg-yellow-500', 'bg-gray-200', 'bg-gray-200'];
      case 3: return ['bg-primary-400', 'bg-primary-400', 'bg-primary-400', 'bg-gray-200'];
      case 4: return ['bg-green-500', 'bg-green-500', 'bg-green-500', 'bg-green-500'];
      default: return ['bg-gray-200', 'bg-gray-200', 'bg-gray-200', 'bg-gray-200'];
    }
  };

  const getLabel = () => {
    switch (strength) {
      case 0: return 'Very Weak';
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return '';
    }
  };

  const colors = getColors();

  return (
    <div className="mt-2">
      <div className="flex gap-1 h-1.5">
        {colors.map((color, i) => (
          <div key={i} className={`flex-1 rounded-full ${color} transition-colors duration-300`} />
        ))}
      </div>
      <div className="flex justify-between items-center mt-1.5">
        <span className={`text-xs font-medium ${strength >= 3 ? 'text-green-600' : 'text-gray-500'}`}>
          {getLabel()}
        </span>
        <span className="text-xs text-gray-400">Min 8 chars, 1 uppercase, 1 number</span>
      </div>
    </div>
  );
};

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { mutate: registerUser, isPending } = useRegister();

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' }
  });

  const passwordValue = watch('password', '');
  const strength = getStrength(passwordValue);

  const onSubmit = (data) => {
    const { confirmPassword, ...registerData } = data;
    registerUser(registerData, {
      onSuccess: () => {
        toast.success('Registration successful. Please verify your email.');
        // Pass email to next page state
        navigate('/verify-email', { state: { email: data.email } });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Registration failed');
      }
    });
  };

  return (
    <div className="min-h-screen flex bg-primary-50">
      {/* Left Side: Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-primary-100 relative">
          
          <div className="text-center">
            <div className="lg:hidden flex justify-center mb-6">
              <Link to="/" className="inline-flex items-center text-primary-700">
                <Store className="w-8 h-8 mr-2" />
                <span className="text-2xl font-bold tracking-tight">Cravo</span>
              </Link>
            </div>
            <h2 className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight">Join the marketplace</h2>
            <p className="mt-3 text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-500 transition-colors">
                Sign in here
              </Link>
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-5">
              <Input
                label="Email address"
                icon={Mail}
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register('email')}
              />
              
              <div>
                <Input
                  label="Password"
                  type="password"
                  icon={Lock}
                  placeholder="••••••••"
                  error={errors.password?.message}
                  {...register('password')}
                />
                {passwordValue.length > 0 && <PasswordStrengthMeter strength={strength} />}
              </div>

              <Input
                label="Confirm Password"
                type="password"
                icon={ShieldCheck}
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
            </div>

            <Button type="submit" className="w-full h-12 text-lg shadow-md" isLoading={isPending}>
              Create Account
            </Button>
            
            <p className="text-xs text-center text-gray-500 mt-4">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        </div>
      </div>

      {/* Right Side: Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary-900 overflow-hidden">
        <div className="absolute inset-0 bg-primary-900/20 z-10" />
        <img 
          src="/auth-bg.png" 
          alt="Fresh artisanal food" 
          className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/90 via-primary-900/40 to-transparent z-10" />
        <div className="absolute bottom-0 right-0 p-12 z-20 text-white text-right">
          <div className="flex flex-col items-end space-y-4 mb-6">
            <div className="flex items-center text-primary-100">
              <span className="font-medium mr-2">Support Local Growers</span>
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex items-center text-primary-100">
              <span className="font-medium mr-2">Authentic Homemade Food</span>
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex items-center text-primary-100">
              <span className="font-medium mr-2">Secure Payments</span>
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
          </div>
          <h2 className="text-4xl font-extrabold mb-4 leading-tight">
            Start your journey <br/> with us today.
          </h2>
        </div>
      </div>
    </div>
  );
};
