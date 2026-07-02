import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../schemas/auth.schemas.js';
import { useLogin, useGoogleLogin } from '../hooks/useAuthQueries.js';
import { GoogleLogin } from '@react-oauth/google';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Leaf } from 'lucide-react';
import { toast } from 'sonner';
import logoImg from '../../../logo.png';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mutate: login, isPending } = useLogin();
  const { mutate: googleLogin } = useGoogleLogin();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const from = location.state?.from?.pathname || '/';

  const onSubmit = (data) => {
    login(data, {
      onSuccess: (res) => {
        toast.success('Logged in successfully');
        const { role, isFirstLogin } = res.data.user;
        if (role === 'SELLER') {
          if (isFirstLogin) {
            navigate('/');
          } else {
            navigate('/seller/dashboard');
          }
        }
        else if (role === 'ADMIN') navigate('/admin/dashboard');
        else navigate(from !== '/login' ? from : '/');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Login failed');
      }
    });
  };

  const handleGoogleSuccess = (credentialResponse) => {
    googleLogin(credentialResponse.credential, {
      onSuccess: (res) => {
        toast.success('Logged in successfully');
        const { role, isFirstLogin } = res.data.user;
        if (role === 'SELLER') {
          if (isFirstLogin) {
            navigate('/');
          } else {
            navigate('/seller/dashboard');
          }
        }
        else if (role === 'ADMIN') navigate('/admin/dashboard');
        else navigate(from !== '/login' ? from : '/');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Google login failed');
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#FAFBFA] select-none font-sans">

      {/* LEFT SECTION (55% width on desktop) */}
      <div className="relative lg:w-[55%] flex flex-col justify-between p-12 lg:py-16 lg:pl-28 lg:pr-16 xl:py-24 xl:pl-40 xl:pr-24 bg-[#FAFBFA] overflow-hidden shrink-0">
        {/* Atmospheric Background Image Layer */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          <img
            src="/login%20bg.png"
            alt="CRAVO marketplace backdrop"
            className="w-full h-full object-cover opacity-45 filter blur-[3px] contrast-[0.85] saturate-[0.9] brightness-[1.0]"
          />
          {/* Soft White Overlay blending smoothly */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FAFBFA]/50 to-[#FAFBFA]" />
        </div>

        {/* Header containing Logo */}
        <header className="relative z-10 w-full flex justify-start">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoImg} alt="Cravo Logo" className="h-24 w-auto max-w-xs object-contain mix-blend-multiply" />
          </Link>
        </header>

        {/* Main Slogan Area */}
        <main className="relative z-10 my-auto py-16 lg:py-24 max-w-xl">
          {/* Thin green accent line */}
          <div className="w-12 h-[3px] bg-[#16a34a] rounded-full mb-8" />
          <h1 className="text-4xl xl:text-5xl font-medium text-gray-900 leading-[1.2] tracking-tight">
            Discover the taste <br /> of home, delivered.
          </h1>
          <p className="text-base text-gray-500 font-normal mt-6 leading-relaxed max-w-md">
            Join thousands of food lovers connecting directly with local chefs and homegrown businesses in your neighborhood.
          </p>
        </main>

        {/* Footer aligned bottom-left of left panel */}
        <footer className="relative z-10 w-full flex justify-start">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full border border-gray-150 bg-white flex items-center justify-center text-[#16a34a] shadow-sm shrink-0">
              <Leaf size={18} className="stroke-[2]" />
            </div>
            <div className="flex flex-col">
              <p className="text-xs lg:text-sm font-semibold text-gray-600">
                Good food. Local people. Stronger communities.
              </p>
              <p className="text-[10px] lg:text-xs text-gray-400 mt-1">
                © 2025 Cravo • All rights reserved
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* RIGHT SECTION (45% width on desktop) */}
      <div className="lg:w-[45%] flex-1 flex items-center justify-start p-8 lg:pl-12 xl:pl-16 bg-[#FAFBFA] relative z-10">
        {/* Large premium floating card */}
        <div className="w-full max-w-[580px] bg-white p-8 lg:p-14 xl:p-16 rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.015)] border border-gray-100 flex flex-col gap-6">

          <div className="text-center">
            {/* Circular CRAVO Leaf Icon */}
            <div className="w-16 h-16 rounded-full bg-[#f0fdf4] text-[#16a34a] flex items-center justify-center mx-auto mb-6 shadow-[0_4px_12px_rgba(22,163,74,0.04)]">
              <Leaf size={28} className="stroke-[2]" />
            </div>
            <h2 className="text-2xl lg:text-[26px] font-semibold text-gray-800 tracking-tight">Welcome back</h2>
            <p className="mt-2 text-sm text-gray-500 font-normal">
              New to Cravo?{' '}
              <Link to="/register" className="font-semibold text-[#16a34a] hover:text-[#15803d] hover:underline transition-colors duration-200">
                Create a free account
              </Link>
            </p>
          </div>

          {/* Google button */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                toast.error('Google login failed');
              }}
              useOneTap
              theme="outline"
              shape="rectangular"
              width="384"
              text="signin_with"
            />
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <span className="relative px-4 bg-white text-xs font-semibold text-gray-400">
              Or continue with email
            </span>
          </div>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="block text-xs font-semibold text-gray-600">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Mail size={18} className="stroke-[1.5]" />
                </div>
                <input
                  type="email"
                  placeholder="nouri23@gmail.com"
                  className={`w-full pl-12 pr-4 h-14 bg-white border ${errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/10 focus:outline-none'} rounded-xl text-sm font-medium text-gray-700 transition-all duration-200 motion-reduce:transition-none`}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs font-semibold text-red-500 flex items-center gap-2">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="block text-xs font-semibold text-gray-600">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} className="stroke-[1.5]" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="•••••••••"
                  className={`w-full pl-12 pr-12 h-14 bg-white border ${errors.password ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/10 focus:outline-none'} rounded-xl text-sm font-medium text-gray-700 transition-all duration-200 motion-reduce:transition-none`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} className="stroke-[1.5]" /> : <Eye size={18} className="stroke-[1.5]" />}
                </button>
              </div>
              <div className="flex justify-end mt-1">
                <Link to="/forgot-password" className="text-xs font-bold text-[#16a34a] hover:text-[#15803d] hover:underline transition-colors duration-200">
                  Forgot your password?
                </Link>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs font-semibold text-red-500 flex items-center gap-2">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full h-14 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl font-semibold text-sm transition-colors duration-200 motion-reduce:transition-none shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isPending ? (
                <span className="animate-spin motion-reduce:animate-none rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
              ) : (
                'Sign in to your account'
              )}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
};
