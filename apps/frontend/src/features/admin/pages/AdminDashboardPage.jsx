import React, { useEffect, useState } from 'react';
import { Users, Store, IndianRupee, TrendingUp, UserCheck, UserX } from 'lucide-react';
import { adminService } from '../services/admin.service.js';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDashboardStats();
      setStats(data.data?.stats);
    } catch (error) {
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A2B]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Platform overview and key metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `₹${stats.totalRevenue.toFixed(2)}`, icon: <IndianRupee size={20} className="text-indigo-500"/>, bg: 'bg-indigo-50' },
          { label: 'Total Users', value: stats.totalUsers, icon: <Users size={20} className="text-emerald-500"/>, bg: 'bg-emerald-50' },
          { label: 'Active Sellers', value: stats.activeSellers, icon: <Store size={20} className="text-amber-500"/>, bg: 'bg-amber-50' },
          { label: 'Platform Growth', value: `${stats.platformGrowth}%`, icon: <TrendingUp size={20} className="text-purple-500"/>, bg: 'bg-purple-50' },
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

      {stats.revenueChartData && (
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue Overview</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} tickFormatter={(value) => `₹${value}`} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  formatter={(value) => [`₹${value}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">Pending Seller Approvals</h3>
            <span className="text-xs font-semibold px-2 py-1 bg-amber-100 text-amber-800 rounded-full">{stats.pendingApprovals?.length || 0}</span>
          </div>
          
          {stats.pendingApprovals?.length > 0 ? (
            <div className="space-y-4">
              {stats.pendingApprovals.map(app => (
                <div key={app.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                  <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 font-bold">
                    {app.user?.profile?.fullName?.[0] || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{app.user?.profile?.fullName || 'No Name'}</p>
                    <p className="text-xs text-gray-500">{app.user?.email}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
                <UserCheck size={32} />
              </div>
              <p className="text-gray-500 font-medium">No pending approvals.</p>
              <p className="text-xs text-gray-400 mt-1">All seller applications have been processed.</p>
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">Recent User Signups</h3>
          </div>
          
          {stats.recentSignups?.length > 0 ? (
            <div className="space-y-4">
              {stats.recentSignups.map(user => (
                <div key={user.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                      {user.profile?.fullName?.[0] || user.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{user.profile?.fullName || 'No Name'}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
                <Users size={32} />
              </div>
              <p className="text-gray-500 font-medium">No recent signups.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

