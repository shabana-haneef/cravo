import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../schemas/auth.schemas.js';
import { useLogin } from '../hooks/useAuthQueries.js';
import { Input } from '../../../components/ui/Input.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Store } from 'lucide-react';
import { toast } from 'sonner';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { mutate: login, isPending } = useLogin();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = (data) => {
    login(data, {
      onSuccess: (res) => {
        toast.success('Logged in successfully');
        const role = res.data.user.role;
        if (role === 'SELLER') navigate('/seller/dashboard');
        else if (role === 'ADMIN') navigate('/admin/dashboard');
        else navigate('/');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Login failed');
      }
    });
  };

  return (
    <div className="min-h-screen flex bg-primary-50">
      {/* Left Side: Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary-900 overflow-hidden">
        <div className="absolute inset-0 bg-primary-900/20 z-10" />
        <img 
          src="/auth-bg.png" 
          alt="Fresh artisanal food" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/90 via-primary-900/40 to-transparent z-10" />
        <div className="absolute bottom-0 left-0 p-12 z-20 text-white">
          <Link to="/" className="inline-flex items-center text-primary-50 hover:text-white transition-colors mb-6 group">
            <Store className="w-8 h-8 mr-3 group-hover:scale-110 transition-transform" />
            <span className="text-2xl font-bold tracking-tight">Cravo</span>
          </Link>
          <h2 className="text-4xl font-extrabold mb-4 leading-tight">
            Discover the taste of <br/> home, delivered.
          </h2>
          <p className="text-lg text-primary-100 max-w-md">
            Join thousands of food lovers connecting directly with local chefs and homegrown businesses in your neighborhood.
          </p>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-primary-100">
          <div className="text-center">
            <div className="lg:hidden flex justify-center mb-6">
              <Link to="/" className="inline-flex items-center text-primary-700">
                <Store className="w-8 h-8 mr-2" />
                <span className="text-2xl font-bold tracking-tight">Cravo</span>
              </Link>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome back</h2>
            <p className="mt-3 text-sm text-gray-600">
              New to Cravo?{' '}
              <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-500 transition-colors">
                Create a free account
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
              <div className="space-y-1">
                <Input
                  label="Password"
                  type="password"
                  icon={Lock}
                  placeholder="••••••••"
                  error={errors.password?.message}
                  {...register('password')}
                />
                <div className="flex justify-end pt-1">
                  <Link to="/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors">
                    Forgot your password?
                  </Link>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-lg shadow-md" isLoading={isPending}>
              Sign in to your account
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
