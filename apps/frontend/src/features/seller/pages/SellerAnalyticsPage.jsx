import React from 'react';
import { BarChart3, TrendingUp, Users, CreditCard } from 'lucide-react';

export const SellerAnalyticsPage = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Track your shop's performance over time.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: '₹0.00', icon: <CreditCard size={20} className="text-blue-500"/>, bg: 'bg-blue-50' },
          { label: 'Total Orders', value: '0', icon: <TrendingUp size={20} className="text-emerald-500"/>, bg: 'bg-emerald-50' },
          { label: 'Store Visitors', value: '0', icon: <Users size={20} className="text-amber-500"/>, bg: 'bg-amber-50' },
          { label: 'Conversion Rate', value: '0%', icon: <BarChart3 size={20} className="text-purple-500"/>, bg: 'bg-purple-50' },
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

      <div className="bg-white border border-gray-100 rounded-xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
          <BarChart3 size={32} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Not enough data</h3>
        <p className="text-gray-500 max-w-sm">We need more sales and traffic data to generate meaningful charts and insights. Check back later!</p>
      </div>
    </div>
  );
};
