import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ProtectedRoute, RoleRoute, PublicRoute } from './guards/AuthGuards.jsx';
import { LoadingScreen } from '../components/ui/LoadingScreen.jsx';
import { MainLayout } from '../layouts/MainLayout.jsx';
import { SellerLayout } from '../layouts/SellerLayout.jsx';

import { AdminLayout } from '../layouts/AdminLayout.jsx';

// Lazy load auth pages
const LoginPage = React.lazy(() => import('../features/auth/pages/LoginPage.jsx').then(m => ({ default: m.LoginPage })));
const RegisterPage = React.lazy(() => import('../features/auth/pages/RegisterPage.jsx').then(m => ({ default: m.RegisterPage })));
const VerifyEmailPage = React.lazy(() => import('../features/auth/pages/VerifyEmailPage.jsx').then(m => ({ default: m.VerifyEmailPage })));
const ForgotPasswordPage = React.lazy(() => import('../features/auth/pages/ForgotPasswordPage.jsx').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = React.lazy(() => import('../features/auth/pages/ResetPasswordPage.jsx').then(m => ({ default: m.ResetPasswordPage })));

// Lazy load admin pages
const AdminDashboardPage = React.lazy(() => import('../features/admin/pages/AdminDashboardPage.jsx').then(m => ({ default: m.AdminDashboardPage })));
const AdminUsersPage = React.lazy(() => import('../features/admin/pages/AdminUsersPage.jsx').then(m => ({ default: m.AdminUsersPage })));
const AdminSellersPage = React.lazy(() => import('../features/admin/pages/AdminSellersPage.jsx').then(m => ({ default: m.AdminSellersPage })));
const AdminAdsPage = React.lazy(() => import('../features/admin/pages/AdminAdsPage.jsx').then(m => ({ default: m.AdminAdsPage })));
const AdminSettingsPage = React.lazy(() => import('../features/admin/pages/AdminSettingsPage.jsx').then(m => ({ default: m.AdminSettingsPage })));
const AdminProductsPage = React.lazy(() => import('../features/admin/pages/AdminProductsPage.jsx').then(m => ({ default: m.AdminProductsPage })));
const AdminAuditLogsPage = React.lazy(() => import('../features/admin/pages/AdminAuditLogsPage.jsx').then(m => ({ default: m.AdminAuditLogsPage })));
const AdminIntegrationsPage = React.lazy(() => import('../features/admin/pages/AdminIntegrationsPage.jsx').then(m => ({ default: m.AdminIntegrationsPage })));

// Lazy load marketplace pages
const HomePage = React.lazy(() => import('../features/customer/pages/HomePage.jsx').then(m => ({ default: m.HomePage })));
const CategoriesPage = React.lazy(() => import('../features/customer/pages/CategoriesPage.jsx').then(m => ({ default: m.CategoriesPage })));
const ProductListingPage = React.lazy(() => import('../features/customer/pages/ProductListingPage.jsx').then(m => ({ default: m.ProductListingPage })));
const ProductDetailsPage = React.lazy(() => import('../features/customer/pages/ProductDetailsPage.jsx').then(m => ({ default: m.ProductDetailsPage })));
const AboutUsPage = React.lazy(() => import('../features/customer/pages/AboutUsPage.jsx').then(m => ({ default: m.AboutUsPage })));
const ContactUsPage = React.lazy(() => import('../features/customer/pages/ContactUsPage.jsx').then(m => ({ default: m.ContactUsPage })));
const PrivacyPolicyPage = React.lazy(() => import('../features/customer/pages/PrivacyPolicyPage.jsx').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsPage = React.lazy(() => import('../features/customer/pages/TermsPage.jsx').then(m => ({ default: m.TermsPage })));
const FaqPage = React.lazy(() => import('../features/customer/pages/FaqPage.jsx').then(m => ({ default: m.FaqPage })));
const CookiePolicyPage = React.lazy(() => import('../features/customer/pages/CookiePolicyPage.jsx').then(m => ({ default: m.CookiePolicyPage })));
const ShippingPolicyPage = React.lazy(() => import('../features/customer/pages/ShippingPolicyPage.jsx').then(m => ({ default: m.ShippingPolicyPage })));
const TrackOrder = React.lazy(() => import('../features/customer/pages/TrackOrder.jsx').then(m => ({ default: m.TrackOrder })));
const SellerTermsPage = React.lazy(() => import('../features/customer/pages/SellerTermsPage.jsx').then(m => ({ default: m.SellerTermsPage })));
const WishlistPage = React.lazy(() => import('../features/wishlist/pages/WishlistPage.jsx').then(m => ({ default: m.WishlistPage })));

// Lazy load cart, checkout, and order pages
const CartPage = React.lazy(() => import('../features/cart/pages/CartPage.jsx').then(m => ({ default: m.CartPage })));
const CheckoutPage = React.lazy(() => import('../features/orders/pages/CheckoutPage.jsx').then(m => ({ default: m.CheckoutPage })));
const OrderSuccessPage = React.lazy(() => import('../features/orders/pages/OrderSuccessPage.jsx').then(m => ({ default: m.OrderSuccessPage })));
const OrdersPage = React.lazy(() => import('../features/orders/pages/OrdersPage.jsx').then(m => ({ default: m.OrdersPage })));
const OrderDetailsPage = React.lazy(() => import('../features/orders/pages/OrderDetailsPage.jsx').then(m => ({ default: m.OrderDetailsPage })));

// Lazy load profile/account pages
const ProfilePage = React.lazy(() => import('../features/users/pages/ProfilePage.jsx').then(m => ({ default: m.ProfilePage })));
const AddressesPage = React.lazy(() => import('../features/users/pages/AddressesPage.jsx').then(m => ({ default: m.AddressesPage })));

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
      { path: '/categories', element: <S><CategoriesPage /></S> },
      { path: '/products', element: <S><ProductListingPage /></S> },
      { path: '/products/:slug', element: <S><ProductDetailsPage /></S> },
      { path: '/about', element: <S><AboutUsPage /></S> },
      { path: '/contact', element: <S><ContactUsPage /></S> },
      { path: '/help', element: <S><ContactUsPage /></S> },
      { path: '/privacy', element: <S><PrivacyPolicyPage /></S> },
      { path: '/terms', element: <S><TermsPage /></S> },
      { path: '/faq', element: <S><FaqPage /></S> },
      { path: '/faqs', element: <S><FaqPage /></S> },
      { path: '/cookie-policy', element: <S><CookiePolicyPage /></S> },
      { path: '/shipping-policy', element: <S><ShippingPolicyPage /></S> },
      { path: '/track-order', element: <S><TrackOrder /></S> },
      { path: '/seller-terms', element: <S><SellerTermsPage /></S> },

      // Protected customer routes (nested under MainLayout)
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/cart', element: <S><CartPage /></S> },
          { path: '/checkout', element: <S><CheckoutPage /></S> },
          { path: '/orders/success', element: <S><OrderSuccessPage /></S> },
          { path: '/orders', element: <S><OrdersPage /></S> },
          { path: '/orders/:id', element: <S><OrderDetailsPage /></S> },
          { path: '/profile', element: <S><ProfilePage /></S> },
          { path: '/addresses', element: <S><AddressesPage /></S> },
          { path: '/seller/application', element: <S><SellerApplicationContainer /></S> },
          { path: '/wishlist', element: <S><WishlistPage /></S> },
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
              { path: '/seller/products/new', element: <Navigate to="/seller/products?add=true" replace /> },
              { path: '/seller/products/:id/edit', element: <S><EditProductPage /></S> },
              { path: '/seller/inventory', element: <S><InventoryDashboardPage /></S> },
              { path: '/seller/inventory/:variantId/history', element: <S><InventoryHistoryPage /></S> },
              { path: '/seller/orders', element: <S><SellerOrdersPage /></S> },
              { path: '/seller/shop-profile', element: <Navigate to="/seller/settings?tab=store-profile" replace /> },
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

  // Admin routes (with dedicated AdminLayout, OUTSIDE MainLayout)
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            element: <RoleRoute allowedRoles={['ADMIN']} />,
            children: [
              { path: '/admin/dashboard', element: <S><AdminDashboardPage /></S> },
              { path: '/admin/users', element: <S><AdminUsersPage /></S> },
              { path: '/admin/sellers', element: <S><AdminSellersPage /></S> },
              { path: '/admin/ads', element: <S><AdminAdsPage /></S> },
              { path: '/admin/products', element: <S><AdminProductsPage /></S> },
              { path: '/admin/settings', element: <S><AdminSettingsPage /></S> },
              { path: '/admin/audit-logs', element: <S><AdminAuditLogsPage /></S> },
              { path: '/admin/integrations', element: <S><AdminIntegrationsPage /></S> }
            ]
          }
        ]
      }
    ]
  }
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
