import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '../features/admin/components/AdminSidebar.jsx';
import { AdminHeader } from '../features/admin/components/AdminHeader.jsx';

export const AdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-[#f3f4f6] font-sans antialiased text-gray-800">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
