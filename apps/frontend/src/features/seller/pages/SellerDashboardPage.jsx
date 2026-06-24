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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Revenue */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">TOTAL REVENUE</p>
              <h2 className="text-xl font-semibold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</h2>
            </div>
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-500 shrink-0">
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
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0">
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
            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
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
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Revenue Analytics</h3>
              <p className="text-[11px] text-gray-400 font-semibold mt-0.5">Monthly performance overview</p>
            </div>
            <div className="relative">
              <select className="appearance-none bg-white border border-gray-200 text-gray-700 py-1 pl-3 pr-8 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-green-600/20 cursor-pointer">
                <option>This Month</option>
                <option>Last Month</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>
          <div className="h-[200px] w-full">
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
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#6b7280' }} 
                  domain={[0, 40]}
                  ticks={[0, 10, 20, 30, 40]}
                  tickFormatter={(val) => val === 0 ? '₹0' : `${(val / 1000).toFixed(2)}k`}
                />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`₹${value}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart (Order Distribution) */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Order Distribution</h3>
            <p className="text-[11px] text-gray-400 font-semibold mt-0.5">Status breakdown</p>
          </div>
          
          <div className="flex-1 flex items-center justify-between gap-4 min-h-[140px] my-2">
            {/* Legend (Left) */}
            <div className="flex-1 space-y-2.5">
              {stats.distribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-[11px] font-bold text-gray-500">{item.name}</span>
                  </div>
                  <span className="text-[11px] font-black text-gray-900">
                    {item.value} <span className="text-gray-400 font-normal ml-0.5">({stats.totalOrdersForChart > 0 ? ((item.value / stats.totalOrdersForChart) * 100).toFixed(1) : '0.0'}%)</span>
                  </span>
                </div>
              ))}
            </div>
            
            {/* Donut chart (Right) */}
            <div className="w-[130px] h-[130px] relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={58}
                    paddingAngle={3}
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
                <span className="text-lg font-bold text-gray-900 leading-none">
                  {stats.totalOrdersForChart}
                </span>
                <span className="text-[8px] font-extrabold text-gray-400 tracking-wider uppercase mt-1">TOTAL</span>
              </div>
            </div>
          </div>

          <Link to="/seller/orders" className="w-full py-2 bg-[#F0FDF4] hover:bg-[#E8FBF0] text-[#16A34A] rounded-xl text-xs font-bold flex items-center justify-center transition-colors">
            View All Orders <ChevronRight size={14} className="ml-1" />
          </Link>
        </div>

      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Latest Orders */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-gray-900">Latest Orders</h3>
            <Link to="/seller/orders" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center">
              View All <ChevronRight size={14} className="ml-0.5" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8">
              <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                <ShoppingBag size={18} className="text-gray-400" />
              </div>
              <h4 className="text-xs font-semibold text-gray-900">No orders yet</h4>
              <p className="text-[10px] text-gray-500 mt-0.5">Your latest orders will appear here.</p>
            </div>
          ) : (
            <div className="space-y-2 flex-1 overflow-y-auto max-h-[160px]">
              {orders.slice(0, 2).map((order) => {
                const statusColors = {
                  PENDING: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'PENDING PAYMENT' },
                  PROCESSING: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'PROCESSING' },
                  SHIPPED: { bg: 'bg-purple-50', text: 'text-purple-600', label: 'SHIPPED' },
                  DELIVERED: { bg: 'bg-green-50', text: 'text-green-600', label: 'DELIVERED' },
                  CANCELLED: { bg: 'bg-red-50', text: 'text-red-600', label: 'CANCELLED' },
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
                        <p className="text-xs font-bold text-gray-900">
                          #{String(order.id || order._id).slice(-6).toUpperCase()}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5 font-semibold">
                          {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''} &middot; ₹{(order.totalAmount || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-black tracking-wide px-2 py-0.5 rounded ${sc.bg} ${sc.text}`}>
                        {sc.label || order.status}
                      </span>
                      <ChevronRight size={14} className="text-gray-300" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions (2x2 Grid) */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-gray-900">Quick Actions</h3>
            <Link to="#" className="text-xs font-bold text-blue-600 hover:text-blue-700">
              See All
            </Link>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Link to="/seller/products?add=true" className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm bg-white transition-all cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                <Plus size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 leading-tight">Create New Product</p>
                <p className="text-[9px] text-gray-400 mt-0.5 font-medium leading-none">Add a new product</p>
              </div>
            </Link>

            <Link to="/seller/orders" className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm bg-white transition-all cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
                <ShoppingBag size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 leading-tight">View Orders</p>
                <p className="text-[9px] text-gray-400 mt-0.5 font-medium leading-none">Manage orders</p>
              </div>
            </Link>

            <Link to="/seller/products" className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm bg-white transition-all cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                <Package size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 leading-tight">Manage Products</p>
                <p className="text-[9px] text-gray-400 mt-0.5 font-medium leading-none">Edit catalogue</p>
              </div>
            </Link>

            <Link to="/seller/analytics" className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm bg-white transition-all cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                <BarChart2 size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 leading-tight">View Analytics</p>
                <p className="text-[9px] text-gray-400 mt-0.5 font-medium leading-none">Track statistics</p>
              </div>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
