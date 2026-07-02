import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useMyShop } from '../../sellers/hooks/useShopQueries.js';
import { useMyProducts } from '../../products/hooks/useSellerProductQueries.js';
import { useSellerOrders } from '../../orders/hooks/useSellerOrderQueries.js';
import { useAuthStore } from '../../../store/auth.store.js';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  IndianRupee, Package, Users, Clock, Plus, ChevronRight, Calendar, Search,
  ShoppingBag, BarChart2, Settings, Megaphone
} from 'lucide-react';

const COLORS = ['#A855F7', '#10B981', '#3B82F6']; // Purple (Pending), Green (Completed), Blue (Cancelled)

export const SellerDashboardPage = () => {
  const { user } = useAuthStore();
  const { data: shop } = useMyShop();
  const { data: productsData } = useMyProducts();
  const products = productsData?.products || [];
  
  const { data: ordersData } = useSellerOrders();
  const orders = ordersData?.orders || [];

  // Derived stats
  const stats = useMemo(() => {
    const totalProducts = products.length;
    
    const allVariants = products.flatMap(p => p.variants || []);
    const stockAlerts = allVariants.filter(v => {
      const avail = v.inventory?.availableStock ?? v.stock ?? 0;
      const thresh = v.inventory?.lowStockThreshold ?? 5;
      return avail <= thresh;
    }).length;

    const activeOrders = orders.filter(o => !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(o.status)).length;
    const totalRevenue = orders
      .filter(o => o.status === 'DELIVERED')
      .reduce((acc, o) => acc + (o.grandTotal || o.totalAmount || 0), 0);

    // Distribution data for Donut Chart
    const pending = orders.filter(o => !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(o.status)).length;
    const completed = orders.filter(o => o.status === 'DELIVERED').length;
    const cancelled = orders.filter(o => ['CANCELLED', 'REFUNDED'].includes(o.status)).length;
    
    const totalOrdersForChart = pending + completed + cancelled;
    
    // Generate chart data for the last 7 days
    const chartData = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const dayRevenue = orders
        .filter(o => o.status === 'DELIVERED')
        .filter(o => {
          const orderDate = new Date(o.createdAt);
          return orderDate.getDate() === d.getDate() && orderDate.getMonth() === d.getMonth() && orderDate.getFullYear() === d.getFullYear();
        })
        .reduce((sum, o) => sum + (o.grandTotal || o.totalAmount || 0), 0);
        
      chartData.push({ name: dateStr, revenue: dayRevenue });
    }
    
    return { 
      totalProducts, 
      stockAlerts, 
      activeOrders, 
      totalRevenue,
      chartData,
      distribution: [
        { name: 'Active', value: pending, color: '#A855F7' }, 
        { name: 'Completed', value: completed, color: '#10B981' },
        { name: 'Cancelled', value: cancelled, color: '#3B82F6' }
      ],
      totalOrdersForChart
    };
  }, [products, orders]);

  return (
    <div className="space-y-4">
      {/* Header text */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome back, {(user?.profile?.fullName?.split(' ') || [])[0] || (user?.email?.split('@') || [])[0] || 'testseller'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here's a quick overview of your shop operations today.
          </p>
        </div>
        
        {/* Ad & Promotion Campaign Top Banner */}
        <Link to="/seller/ads" className="flex items-center gap-4 px-5 py-3 rounded-xl border border-transparent bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md hover:shadow-lg transition-all cursor-pointer relative overflow-hidden group shrink-0">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/20 rounded-full blur-2xl group-hover:bg-white/30 transition-all"></div>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0 z-10 relative">
            <Megaphone size={20} />
          </div>
          <div className="z-10 relative">
            <p className="text-sm font-bold text-white flex items-center gap-2">
              Ad & Promotion Campaigns
              <span className="text-[9px] bg-white text-pink-600 px-1.5 py-0.5 rounded font-black uppercase tracking-wider shadow-sm">New</span>
            </p>
            <p className="text-xs text-white/90 mt-0.5">Boost sales with targeted ads</p>
          </div>
        </Link>
      </div>

      {/* KPI Cards (Top Row) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Total Revenue */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">TOTAL REVENUE</p>
              <h2 className="text-xl font-semibold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</h2>
            </div>
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-500 shrink-0">
              <IndianRupee size={16} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded flex items-center">↑ 12.5%</span>
            <span className="text-gray-400">vs last period</span>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">TOTAL PRODUCTS</p>
              <h2 className="text-xl font-semibold text-gray-900">{stats.totalProducts}</h2>
            </div>
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600 shrink-0">
              <Package size={16} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded flex items-center">↑ 4.2%</span>
            <span className="text-gray-400">vs last period</span>
          </div>
        </div>

        {/* Active Orders */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">ACTIVE ORDERS</p>
              <h2 className="text-xl font-semibold text-gray-900">{stats.activeOrders}</h2>
            </div>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded flex items-center">↑ 8.1%</span>
            <span className="text-gray-400">vs last period</span>
          </div>
        </div>

        {/* Stock Alerts */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">STOCK ALERTS</p>
              <h2 className="text-xl font-semibold text-gray-900">{stats.stockAlerts}</h2>
            </div>
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 shrink-0">
              <Clock size={16} />
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
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Revenue Analytics</h3>
              <p className="text-xs text-gray-500 mt-1">Monthly performance overview</p>
            </div>
            <div className="relative">
              <select className="appearance-none bg-white border border-gray-200 text-gray-700 py-1.5 pl-3 pr-8 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-600/20">
                <option>This Month</option>
                <option>Last Month</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={{ stroke: '#e5e7eb' }} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(val) => val === 0 ? '₹0' : `₹${val / 1000}k`} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`₹${value}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex flex-col">
          <div className="mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Order Distribution</h3>
            <p className="text-xs text-gray-500 mt-1">Status breakdown</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center relative min-h-[200px] mb-4">
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
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-semibold text-gray-900">
                {stats.totalOrdersForChart}
              </span>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-0.5">TOTAL</span>
            </div>
          </div>
          
          <div className="space-y-3 mb-6">
            {stats.distribution.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></span>
                  <span className="text-xs font-medium text-gray-700">{item.name}</span>
                </div>
                <div className="text-xs font-semibold text-gray-900">
                  {item.value} <span className="text-gray-400 font-normal ml-1">({((item.value / stats.totalOrdersForChart) * 100).toFixed(1)}%)</span>
                </div>
              </div>
            ))}
          </div>

          <Link to="/seller/orders" className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-sm font-semibold flex items-center justify-center transition-colors">
            View All Orders <ChevronRight size={16} className="ml-1" />
          </Link>
        </div>

      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Latest Orders */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Latest Orders</h3>
            <Link to="/seller/orders" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center">
              View All <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                <ShoppingBag size={20} className="text-gray-400" />
              </div>
              <h4 className="text-sm font-semibold text-gray-900">No orders yet</h4>
              <p className="text-xs text-gray-500 mt-1">Your latest orders will appear here.</p>
            </div>
          ) : (
            <div className="space-y-2 flex-1 overflow-y-auto">
              {orders.slice(0, 6).map((order) => {
                const statusColors = {
                  PENDING: { bg: 'bg-yellow-50', text: 'text-yellow-600' },
                  PROCESSING: { bg: 'bg-blue-50', text: 'text-blue-600' },
                  SHIPPED: { bg: 'bg-purple-50', text: 'text-purple-600' },
                  DELIVERED: { bg: 'bg-green-50', text: 'text-green-600' },
                  CANCELLED: { bg: 'bg-red-50', text: 'text-red-600' },
                };
                const sc = statusColors[order.status] || { bg: 'bg-gray-50', text: 'text-gray-600' };
                return (
                    <Link
                      key={order.id || order._id}
                      to="/seller/orders"
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all"
                    >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center text-green-600 shrink-0 overflow-hidden">
                        {order.items?.[0]?.product?.images?.[0]?.imageUrl ? (
                          <img 
                            src={order.items[0].product.images[0].imageUrl} 
                            alt={order.items[0].product?.name || "Product"} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <ShoppingBag size={16} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          #{String(order.id || order._id).slice(-6).toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''} &middot; ₹{(order.totalAmount || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${sc.bg} ${sc.text}`}>
                        {order.status}
                      </span>
                      <ChevronRight size={14} className="text-gray-300" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            <Link to="#" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
              See All
            </Link>
          </div>
          
          <div className="space-y-2">
            <Link to="/seller/products/new" className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                <Plus size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Create New Product</p>
                <p className="text-xs text-gray-500 mt-0.5">Add a new product to your store</p>
              </div>
            </Link>

            <Link to="/seller/orders" className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
                <ShoppingBag size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">View Orders</p>
                <p className="text-xs text-gray-500 mt-0.5">Manage and track your orders</p>
              </div>
            </Link>

            <Link to="/seller/products" className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                <Package size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Manage Products</p>
                <p className="text-xs text-gray-500 mt-0.5">Edit, update or remove products</p>
              </div>
            </Link>

            <Link to="/seller/analytics" className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500 shrink-0">
                <BarChart2 size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">View Analytics</p>
                <p className="text-xs text-gray-500 mt-0.5">Track your store performance</p>
              </div>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
