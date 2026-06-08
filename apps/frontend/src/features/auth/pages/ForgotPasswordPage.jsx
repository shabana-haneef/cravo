import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema } from '../schemas/auth.schemas.js';
import { useForgotPassword } from '../hooks/useAuthQueries.js';
import { Input } from '../../../components/ui/Input.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { mutate: forgotPassword, isPending } = useForgotPassword();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' }
  });

  const onSubmit = (data) => {
    forgotPassword(data, {
      onSuccess: () => {
        toast.success('If an account exists, a reset code has been sent.');
        navigate('/reset-password', { state: { email: data.email } });
      },
      onError: () => {
        // Still act like success to prevent user enumeration
        toast.success('If an account exists, a reset code has been sent.');
        navigate('/reset-password', { state: { email: data.email } });
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Forgot Password</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email to receive a reset code
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Email address"
            icon={Mail}
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Button type="submit" className="w-full" isLoading={isPending}>
            Send Reset Code
          </Button>

          <div className="text-center mt-4">
            <Link to="/login" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500">
              <ArrowLeft size={16} className="mr-1" />
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
