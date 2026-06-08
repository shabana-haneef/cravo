import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useMyShop } from '../../sellers/hooks/useShopQueries.js';
import { useMyProducts } from '../../products/hooks/useSellerProductQueries.js';
import { useSellerOrders } from '../../orders/hooks/useSellerOrderQueries.js';
import { useAuthStore } from '../../../store/auth.store.js';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  IndianRupee, Package, Users, Clock, Plus, ChevronRight, Box
} from 'lucide-react';

// --- Chart Data Simulation (since we don't have historical endpoints yet) ---
const monthlyData = [
  { name: 'Jan', revenue: 0 }, { name: 'Feb', revenue: 0 }, { name: 'Mar', revenue: 0 },
  { name: 'Apr', revenue: 350000 }, { name: 'May', revenue: 2800000 }, { name: 'Jun', revenue: 150000 },
  { name: 'Jul', revenue: 0 }, { name: 'Aug', revenue: 0 }, { name: 'Sep', revenue: 0 },
  { name: 'Oct', revenue: 0 }, { name: 'Nov', revenue: 0 }, { name: 'Dec', revenue: 0 },
];

const COLORS = ['#A855F7', '#10B981', '#3B82F6']; // Purple, Green, Blue matching the donut

export const SellerDashboardPage = () => {
  const { user } = useAuthStore();
  const { data: shop } = useMyShop();
  const { data: products = [] } = useMyProducts();
  const { data: orders = [] } = useSellerOrders();

  // Derived stats
  const stats = useMemo(() => {
    const totalProducts = products.length;
    
    const allVariants = products.flatMap(p => p.variants || []);
    const stockAlerts = allVariants.filter(v => {
      const avail = v.inventory?.availableStock ?? v.stock ?? 0;
      const thresh = v.inventory?.lowStockThreshold ?? 5;
      return avail <= thresh;
    }).length;

    const activeOrders = orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status)).length;
    const totalRevenue = orders
      .filter(o => o.status === 'DELIVERED')
      .reduce((acc, o) => acc + (o.totalAmount || 0), 0);

    // Distribution data for Donut Chart
    const completed = orders.filter(o => o.status === 'DELIVERED').length;
    const pending = orders.filter(o => o.status === 'PENDING').length;
    
    return { 
      totalProducts, 
      stockAlerts, 
      activeOrders, 
      totalRevenue,
      distribution: [
        { name: 'Completed', value: completed || 10 }, 
        { name: 'Active', value: activeOrders || 5 },
        { name: 'Pending', value: pending || 8 }
      ]
    };
  }, [products, orders]);

  return (
    <div className="space-y-6">
      {/* Header text */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back, {user?.profile?.fullName?.split(' ')[0] || user?.email?.split('@')[0]}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Here's a quick overview of your shop operations today.
        </p>
      </div>

      {/* KPI Cards (Top Row) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Revenue */}
        <div className="bg-white border border-gray-100/80 rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">TOTAL REVENUE</p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">₹{stats.totalRevenue.toLocaleString()}</h2>
            </div>
            <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-500">
              <IndianRupee size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="text-emerald-500 font-medium bg-emerald-50 px-1.5 py-0.5 rounded flex items-center">↑ 12.5%</span>
            <span className="text-gray-400">vs last period</span>
          </div>
        </div>

        {/* Total Products (Mapped from Upcoming Events) */}
        <div className="bg-white border border-gray-100/80 rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">TOTAL PRODUCTS</p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalProducts}</h2>
            </div>
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
              <Package size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="text-emerald-500 font-medium bg-emerald-50 px-1.5 py-0.5 rounded flex items-center">↑ 4.2%</span>
            <span className="text-gray-400">vs last period</span>
          </div>
        </div>

        {/* Active Orders (Mapped from Active Customers) */}
        <div className="bg-white border border-gray-100/80 rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">ACTIVE ORDERS</p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">{stats.activeOrders}</h2>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="text-emerald-500 font-medium bg-emerald-50 px-1.5 py-0.5 rounded flex items-center">↑ 8.1%</span>
            <span className="text-gray-400">vs last period</span>
          </div>
        </div>

        {/* Stock Alerts (Mapped from Pending Tasks) */}
        <div className="bg-white border border-gray-100/80 rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">STOCK ALERTS</p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">{stats.stockAlerts}</h2>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="text-red-500 font-medium bg-red-50 px-1.5 py-0.5 rounded flex items-center">↓ 2.4%</span>
            <span className="text-gray-400">vs last period</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-100/80 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Analytics</h3>
            <p className="text-xs text-gray-500">Monthly performance overview</p>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(val) => `₹${val / 1000}k`} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`₹${value}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="bg-white border border-gray-100/80 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-6 flex flex-col">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Order Distribution</h3>
            <p className="text-xs text-gray-500">Status breakdown</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center relative min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-gray-900">
                {stats.distribution.reduce((a, b) => a + b.value, 0)}
              </span>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">TOTAL</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            {stats.distribution.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx] }}></span>
                <span className="text-xs font-medium text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Orders List */}
        <div className="lg:col-span-2 bg-white border border-gray-100/80 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
            <Link to="/seller/orders" className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 uppercase tracking-wider">
              VIEW ALL <ChevronRight size={14} />
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-50">
                <tr>
                  <th className="pb-3 font-medium">ORDER ID</th>
                  <th className="pb-3 font-medium">DATE</th>
                  <th className="pb-3 font-medium">AMOUNT</th>
                  <th className="pb-3 font-medium">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.slice(0, 5).map(order => (
                  <tr key={order.id}>
                    <td className="py-4 font-medium text-gray-900">#{order.id.slice(-8).toUpperCase()}</td>
                    <td className="py-4 text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-4 font-medium text-gray-900">₹{order.totalAmount?.toLocaleString()}</td>
                    <td className="py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold tracking-wide
                        ${order.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600' : 
                          order.status === 'CANCELLED' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">No orders found.</div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-gray-100/80 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">SCROLL FOR MORE</span>
          </div>
          
          <div className="space-y-4">
            <Link to="/seller/products/new" className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/50 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 group-hover:bg-orange-100">
                <Plus size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Add Product</p>
                <p className="text-xs text-gray-500 mt-0.5">List a new item for sale</p>
              </div>
            </Link>

            <Link to="/seller/inventory" className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-100">
                <Box size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Update Stock</p>
                <p className="text-xs text-gray-500 mt-0.5">Adjust inventory levels</p>
              </div>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
