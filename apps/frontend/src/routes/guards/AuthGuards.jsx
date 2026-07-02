import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store.js';

export const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export const RoleRoute = ({ allowedRoles }) => {
  const { user } = useAuthStore();

  if (!user || !allowedRoles.includes(user.role)) {
    // Eject to a safe route based on their actual role or home
    if (user?.role === 'SELLER') {
      if (user?.isFirstLogin) {
        return <Navigate to="/" replace />;
      }
      return <Navigate to="/seller/dashboard" replace />;
    }
    if (user?.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export const PublicRoute = () => {
  const { isAuthenticated, user } = useAuthStore();

  // If already logged in, redirect away from auth pages (login/register)
  if (isAuthenticated) {
    if (user?.role === 'SELLER') {
      if (user?.isFirstLogin) {
        return <Navigate to="/" replace />;
      }
      return <Navigate to="/seller/dashboard" replace />;
    }
    if (user?.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
