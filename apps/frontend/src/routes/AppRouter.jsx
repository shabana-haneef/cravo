import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ProtectedRoute, RoleRoute, PublicRoute } from './guards/AuthGuards.jsx';
import { LoadingScreen } from '../components/ui/LoadingScreen.jsx';
import { MainLayout } from '../layouts/MainLayout.jsx';
import { SellerLayout } from '../layouts/SellerLayout.jsx';

// Lazy load auth pages
const LoginPage = React.lazy(() => import('../features/auth/pages/LoginPage.jsx').then(m => ({ default: m.LoginPage })));
const RegisterPage = React.lazy(() => import('../features/auth/pages/RegisterPage.jsx').then(m => ({ default: m.RegisterPage })));
const VerifyEmailPage = React.lazy(() => import('../features/auth/pages/VerifyEmailPage.jsx').then(m => ({ default: m.VerifyEmailPage })));
const ForgotPasswordPage = React.lazy(() => import('../features/auth/pages/ForgotPasswordPage.jsx').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = React.lazy(() => import('../features/auth/pages/ResetPasswordPage.jsx').then(m => ({ default: m.ResetPasswordPage })));

// Lazy load marketplace pages
const HomePage = React.lazy(() => import('../features/customer/pages/HomePage.jsx').then(m => ({ default: m.HomePage })));
const ProductListingPage = React.lazy(() => import('../features/customer/pages/ProductListingPage.jsx').then(m => ({ default: m.ProductListingPage })));
const ProductDetailsPage = React.lazy(() => import('../features/customer/pages/ProductDetailsPage.jsx').then(m => ({ default: m.ProductDetailsPage })));

// Lazy load cart, checkout, and order pages
const CartPage = React.lazy(() => import('../features/cart/pages/CartPage.jsx').then(m => ({ default: m.CartPage })));
const CheckoutPage = React.lazy(() => import('../features/orders/pages/CheckoutPage.jsx').then(m => ({ default: m.CheckoutPage })));
const OrderSuccessPage = React.lazy(() => import('../features/orders/pages/OrderSuccessPage.jsx').then(m => ({ default: m.OrderSuccessPage })));

// Lazy load profile/account pages
const ProfilePage = React.lazy(() => import('../features/users/pages/ProfilePage.jsx').then(m => ({ default: m.ProfilePage })));
const AddressesPage = React.lazy(() => import('../features/users/pages/AddressesPage.jsx').then(m => ({ default: m.AddressesPage })));

const BecomeSellerPage = React.lazy(() => import('../features/sellers/pages/BecomeSellerPage.jsx').then(m => ({ default: m.BecomeSellerPage })));
const SellerApplicationContainer = React.lazy(() => import('../features/sellers/pages/SellerApplicationContainer.jsx').then(m => ({ default: m.SellerApplicationContainer })));
const ProductsDashboardPage = React.lazy(() => import('../features/sellers/pages/ProductsDashboardPage.jsx').then(m => ({ default: m.ProductsDashboardPage })));
const CreateProductPage = React.lazy(() => import('../features/sellers/pages/CreateProductPage.jsx').then(m => ({ default: m.CreateProductPage })));
const EditProductPage = React.lazy(() => import('../features/sellers/pages/EditProductPage.jsx').then(m => ({ default: m.EditProductPage })));
const InventoryDashboardPage = React.lazy(() => import('../features/inventory/pages/InventoryDashboardPage.jsx').then(m => ({ default: m.InventoryDashboardPage })));
const InventoryHistoryPage = React.lazy(() => import('../features/inventory/pages/InventoryHistoryPage.jsx').then(m => ({ default: m.InventoryHistoryPage })));
const SellerDashboardPage = React.lazy(() => import('../features/seller/pages/SellerDashboardPage.jsx').then(m => ({ default: m.SellerDashboardPage })));
const SellerOrdersPage = React.lazy(() => import('../features/orders/pages/SellerOrdersPage.jsx').then(m => ({ default: m.SellerOrdersPage })));

// New Seller Pages
const SellerAdsPage = React.lazy(() => import('../features/seller/pages/SellerAdsPage.jsx').then(m => ({ default: m.SellerAdsPage })));
const SellerAnalyticsPage = React.lazy(() => import('../features/seller/pages/SellerAnalyticsPage.jsx').then(m => ({ default: m.SellerAnalyticsPage })));
const SellerReviewsPage = React.lazy(() => import('../features/seller/pages/SellerReviewsPage.jsx').then(m => ({ default: m.SellerReviewsPage })));
const SellerSettingsPage = React.lazy(() => import('../features/seller/pages/SellerSettingsPage.jsx').then(m => ({ default: m.SellerSettingsPage })));
const SellerShopProfilePage = React.lazy(() => import('../features/seller/pages/SellerShopProfilePage.jsx').then(m => ({ default: m.SellerShopProfilePage })));

const S = ({ children }) => <Suspense fallback={<LoadingScreen />}>{children}</Suspense>;

const router = createBrowserRouter([
  // Public auth routes (no layout)
  {
    element: <PublicRoute />,
    children: [
      { path: '/login', element: <S><LoginPage /></S> },
      { path: '/register', element: <S><RegisterPage /></S> },
      { path: '/verify-email', element: <S><VerifyEmailPage /></S> },
      { path: '/forgot-password', element: <S><ForgotPasswordPage /></S> },
      { path: '/reset-password', element: <S><ResetPasswordPage /></S> },
    ]
  },

  // MainLayout wrapper for all marketplace & customer pages
  {
    element: <MainLayout />,
    children: [
      // Public marketplace routes
      { path: '/', element: <S><HomePage /></S> },
      { path: '/products', element: <S><ProductListingPage /></S> },
      { path: '/products/:slug', element: <S><ProductDetailsPage /></S> },
      { path: '/become-seller', element: <S><BecomeSellerPage /></S> },

      // Protected customer routes (nested under MainLayout)
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/cart', element: <S><CartPage /></S> },
          { path: '/checkout', element: <S><CheckoutPage /></S> },
          { path: '/orders/success', element: <S><OrderSuccessPage /></S> },
          { path: '/profile', element: <S><ProfilePage /></S> },
          { path: '/addresses', element: <S><AddressesPage /></S> },
          { path: '/seller/application', element: <S><SellerApplicationContainer /></S> },
        ]
      }
    ]
  },

  // Protected seller routes (with dedicated SellerLayout, OUTSIDE MainLayout)
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <SellerLayout />,
        children: [
          {
            element: <RoleRoute allowedRoles={['SELLER']} />,
            children: [
              { path: '/seller/dashboard', element: <S><SellerDashboardPage /></S> },
              { path: '/seller/products', element: <S><ProductsDashboardPage /></S> },
              { path: '/seller/products/new', element: <S><CreateProductPage /></S> },
              { path: '/seller/products/:id/edit', element: <S><EditProductPage /></S> },
              { path: '/seller/inventory', element: <S><InventoryDashboardPage /></S> },
              { path: '/seller/inventory/:variantId/history', element: <S><InventoryHistoryPage /></S> },
              { path: '/seller/orders', element: <S><SellerOrdersPage /></S> },
              { path: '/seller/shop-profile', element: <S><SellerShopProfilePage /></S> },
              { path: '/seller/ads', element: <S><SellerAdsPage /></S> },
              { path: '/seller/analytics', element: <S><SellerAnalyticsPage /></S> },
              { path: '/seller/reviews', element: <S><SellerReviewsPage /></S> },
              { path: '/seller/settings', element: <S><SellerSettingsPage /></S> },
            ]
          }
        ]
      }
    ]
  },

  // Admin routes (no MainLayout)
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <RoleRoute allowedRoles={['ADMIN']} />,
        children: [
          { path: '/admin/dashboard', element: <div>Admin Dashboard</div> }
        ]
      }
    ]
  }
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
