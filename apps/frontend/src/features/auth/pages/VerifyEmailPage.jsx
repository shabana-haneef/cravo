import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { verifyEmailSchema } from '../schemas/auth.schemas.js';
import { useVerifyEmail, useResendOtp } from '../hooks/useAuthQueries.js';
import { Input } from '../../../components/ui/Input.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { toast } from 'sonner';

export const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const { mutate: verifyEmail, isPending } = useVerifyEmail();
  const { mutate: resendOtp, isPending: isResending } = useResendOtp();

  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { otp: '' }
  });

  if (!email) {
    return <Navigate to="/register" replace />;
  }

  const onSubmit = (data) => {
    verifyEmail({ email, otp: data.otp }, {
      onSuccess: () => {
        toast.success('Email verified successfully! You can now login.');
        navigate('/login');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Verification failed');
      }
    });
  };

  const handleResend = () => {
    resendOtp({ email }, {
      onSuccess: () => {
        toast.success('New OTP sent to your email');
        setCountdown(60);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to resend OTP');
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Verify your email</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We sent a 6-digit code to <span className="font-medium text-gray-900">{email}</span>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Verification Code (OTP)"
            icon={KeyRound}
            placeholder="123456"
            maxLength={6}
            error={errors.otp?.message}
            {...register('otp')}
          />

          <Button type="submit" className="w-full" isLoading={isPending}>
            Verify Email
          </Button>
        </form>

        <div className="text-center mt-4 text-sm">
          <button
            type="button"
            disabled={countdown > 0 || isResending}
            onClick={handleResend}
            className="font-medium text-blue-600 hover:text-blue-500 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
          </button>
        </div>
      </div>
    </div>
  );
};
