import React from 'react';
import { Outlet } from 'react-router-dom';
import { SellerSidebar } from '../features/seller/components/SellerSidebar.jsx';
import { SellerHeader } from '../features/seller/components/SellerHeader.jsx';

export const SellerLayout = () => {
  return (
    <div className="flex min-h-screen bg-[#f8f9fc] font-sans antialiased text-gray-800">
      <SellerSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <SellerHeader />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
