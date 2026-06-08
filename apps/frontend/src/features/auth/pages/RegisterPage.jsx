import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '../schemas/auth.schemas.js';
import { useRegister } from '../hooks/useAuthQueries.js';
import { Input } from '../../../components/ui/Input.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { mutate: registerUser, isPending } = useRegister();

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' }
  });

  const passwordValue = watch('password');
  
  // Basic password strength indicator
  const getStrength = (pass) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length >= 8) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[a-z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass)) score += 25;
    return score;
  };

  const strength = getStrength(passwordValue);

  const onSubmit = (data) => {
    registerUser(data, {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your account</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account? <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">Sign in</Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
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
              <div className="mt-2 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${strength < 50 ? 'bg-red-500' : strength < 100 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                  style={{ width: `${strength}%` }}
                ></div>
              </div>
            </div>

            <Input
              label="Confirm Password"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          </div>

          <Button type="submit" className="w-full" isLoading={isPending}>
            Create Account
          </Button>
        </form>
      </div>
    </div>
  );
};
