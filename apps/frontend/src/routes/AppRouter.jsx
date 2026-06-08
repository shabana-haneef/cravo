import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ProtectedRoute, RoleRoute, PublicRoute } from './guards/AuthGuards.jsx';
import { LoadingScreen } from '../components/ui/LoadingScreen.jsx';

// Lazy load auth pages
const LoginPage = React.lazy(() => import('../features/auth/pages/LoginPage.jsx').then(m => ({ default: m.LoginPage })));
const RegisterPage = React.lazy(() => import('../features/auth/pages/RegisterPage.jsx').then(m => ({ default: m.RegisterPage })));
const VerifyEmailPage = React.lazy(() => import('../features/auth/pages/VerifyEmailPage.jsx').then(m => ({ default: m.VerifyEmailPage })));
const ForgotPasswordPage = React.lazy(() => import('../features/auth/pages/ForgotPasswordPage.jsx').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = React.lazy(() => import('../features/auth/pages/ResetPasswordPage.jsx').then(m => ({ default: m.ResetPasswordPage })));

const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      {
        path: '/login',
        element: (
          <Suspense fallback={<LoadingScreen />}>
            <LoginPage />
          </Suspense>
        )
      },
      {
        path: '/register',
        element: (
          <Suspense fallback={<LoadingScreen />}>
            <RegisterPage />
          </Suspense>
        )
      },
      {
        path: '/verify-email',
        element: (
          <Suspense fallback={<LoadingScreen />}>
            <VerifyEmailPage />
          </Suspense>
        )
      },
      {
        path: '/forgot-password',
        element: (
          <Suspense fallback={<LoadingScreen />}>
            <ForgotPasswordPage />
          </Suspense>
        )
      },
      {
        path: '/reset-password',
        element: (
          <Suspense fallback={<LoadingScreen />}>
            <ResetPasswordPage />
          </Suspense>
        )
      }
    ]
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <div>Home Page (Customer Route)</div>
      },
      {
        element: <RoleRoute allowedRoles={['SELLER']} />,
        children: [
          {
            path: '/seller/dashboard',
            element: <div>Seller Dashboard</div>
          }
        ]
      },
      {
        element: <RoleRoute allowedRoles={['ADMIN']} />,
        children: [
          {
            path: '/admin/dashboard',
            element: <div>Admin Dashboard</div>
          }
        ]
      }
    ]
  }
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
