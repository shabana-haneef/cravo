import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema } from '../schemas/auth.schemas.js';
import { useResetPassword } from '../hooks/useAuthQueries.js';
import { Input } from '../../../components/ui/Input.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { KeyRound, Lock } from 'lucide-react';
import { toast } from 'sonner';

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const { mutate: resetPassword, isPending } = useResetPassword();

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { otp: '', password: '', confirmPassword: '' }
  });

  const passwordValue = watch('password');
  
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

  if (!email) {
    return <Navigate to="/forgot-password" replace />;
  }

  const onSubmit = (data) => {
    resetPassword({ email, otp: data.otp, newPassword: data.password }, {
      onSuccess: () => {
        toast.success('Password reset successfully. You can now login.');
        navigate('/login');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to reset password');
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Set new password</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter the 6-digit code sent to <span className="font-medium text-gray-900">{email}</span>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input
              label="Reset Code (OTP)"
              icon={KeyRound}
              placeholder="123456"
              maxLength={6}
              error={errors.otp?.message}
              {...register('otp')}
            />
            
            <div>
              <Input
                label="New Password"
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
              label="Confirm New Password"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          </div>

          <Button type="submit" className="w-full" isLoading={isPending}>
            Reset Password
          </Button>
        </form>
      </div>
    </div>
  );
};
