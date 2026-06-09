import React from 'react';
import { Users, Store, IndianRupee, TrendingUp, UserCheck, UserX } from 'lucide-react';

export const AdminDashboardPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Platform overview and key metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: '₹0.00', icon: <IndianRupee size={20} className="text-indigo-500"/>, bg: 'bg-indigo-50' },
          { label: 'Total Users', value: '0', icon: <Users size={20} className="text-emerald-500"/>, bg: 'bg-emerald-50' },
          { label: 'Active Sellers', value: '0', icon: <Store size={20} className="text-amber-500"/>, bg: 'bg-amber-50' },
          { label: 'Platform Growth', value: '0%', icon: <TrendingUp size={20} className="text-purple-500"/>, bg: 'bg-purple-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${stat.bg}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Pending Seller Approvals</h3>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <UserCheck size={32} />
            </div>
            <p className="text-gray-500 font-medium">No pending approvals.</p>
            <p className="text-xs text-gray-400 mt-1">All seller applications have been processed.</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent User Signups</h3>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <Users size={32} />
            </div>
            <p className="text-gray-500 font-medium">No recent signups.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
