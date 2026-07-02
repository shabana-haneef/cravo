import React, { useEffect, useState } from 'react';
import { 
  FileText, Search, Calendar, ChevronLeft, ChevronRight, 
  RefreshCw, ShieldAlert, Shield, Download, X, Eye, 
  Settings, UserCheck, AlertTriangle, ShieldCheck, Database
} from 'lucide-react';
import { adminService } from '../services/admin.service.js';
import { useAuthStore } from '../../../store/auth.store.js';
import { toast } from 'sonner';

export const AdminAuditLogsPage = () => {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.email === 'shabanahaneef10@gmail.com';

  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalLogs: 0,
    securityEvents: 0,
    systemActions: 0,
    adminActions: 0
  });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showAllDetails, setShowAllDetails] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState(false);

  const handleSelectLog = (log) => {
    setSelectedLog(log);
    setShowAllDetails(false);
  };
  
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1
  });

  // Filter and Search States
  const [search, setSearch] = useState('');
  const [actionType, setActionType] = useState('');
  const [targetType, setTargetType] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  // Available Filter Options
  const actionOptions = [
    { label: 'All Actions', value: '' },
    { label: 'Clear Cache', value: 'CLEAR_CACHE' },
    { label: 'Database Backup', value: 'DATABASE_BACKUP' },
    { label: 'Download Backup', value: 'DOWNLOAD_BACKUP' },
    { label: 'System Health Check', value: 'HEALTH_CHECK_RUN' },
    { label: 'Integration Test', value: 'INTEGRATION_CREDENTIALS_UPDATE' },
    { label: 'Seller Approval', value: 'SELLER_APPROVAL' },
    { label: 'Seller Rejection', value: 'SELLER_REJECTION' },
    { label: 'Product Approval', value: 'PRODUCT_APPROVAL' },
    { label: 'Product Rejection', value: 'PRODUCT_REJECTION' },
    { label: 'User Suspension', value: 'USER_SUSPENSION' },
    { label: 'User Activation', value: 'USER_ACTIVATION' },
    { label: 'Settings Update', value: 'SETTINGS_UPDATE' }
  ];

  const targetOptions = [
    { label: 'All Targets', value: '' },
    { label: 'Database', value: 'DATABASE' },
    { label: 'Database Backup File', value: 'DATABASE_BACKUP_FILE' },
    { label: 'System Cache', value: 'SYSTEM_CACHE' },
    { label: 'Diagnostics', value: 'DIAGNOSTICS' },
    { label: 'Seller', value: 'SELLER' },
    { label: 'Product', value: 'PRODUCT' },
    { label: 'User', value: 'USER' },
    { label: 'Integration Connection', value: 'INTEGRATION_CONNECTION' },
    { label: 'Platform Settings', value: 'PLATFORM_SETTINGS' }
  ];

  const statusOptions = [
    { label: 'All Statuses', value: '' },
    { label: 'Success', value: 'SUCCESS' },
    { label: 'Failed', value: 'FAILED' }
  ];

  useEffect(() => {
    fetchLogs();
  }, [page, actionType, targetType, status, startDate, endDate]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await adminService.getAuditStats();
      if (res?.data?.stats) {
        setStats(res.data.stats);
      }
    } catch (error) {
      console.error('Failed to load audit stats', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        search,
        actionType,
        targetType,
        status,
        startDate,
        endDate
      };
      const response = await adminService.getAuditLogs(params);
      if (response?.data) {
        setLogs(response.data.logs || []);
        setPagination(response.data.pagination || { total: 0, page: 1, limit: 10, pages: 1 });
      }
    } catch (error) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleResetFilters = () => {
    setSearch('');
    setActionType('');
    setTargetType('');
    setStatus('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleExport = async (format) => {
    if (!isSuperAdmin) {
      toast.error('Only the Super Admin is authorized to export audit logs.');
      return;
    }
    try {
      toast.loading(`Preparing ${format.toUpperCase()} export...`, { id: 'export-toast' });
      const params = {
        search,
        actionType,
        targetType,
        status,
        startDate,
        endDate
      };
      await adminService.exportAuditLogs(format, params);
      toast.success(`Audit logs exported successfully!`, { id: 'export-toast' });
    } catch (error) {
      toast.error('Failed to export audit logs', { id: 'export-toast' });
    }
  };

  const getActionBadgeColor = (actionName) => {
    if (!actionName) return 'bg-gray-50 text-gray-600 border-gray-200';
    if (actionName.includes('APPROVAL') || actionName.includes('ACTIVATION') || actionName === 'SUCCESS') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (actionName.includes('REJECTION') || actionName.includes('SUSPENSION') || actionName === 'FAILED' || actionName.includes('FAILED')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (actionName.includes('CLEAR') || actionName.includes('BACKUP')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  return (
    <main className="max-w-[1600px] mx-auto p-4 space-y-6 md:p-6 lg:p-8">
      {/* Header Banner */}
      <header className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Shield className="text-indigo-600 w-6 h-6 motion-safe:animate-pulse" />
            System Audit Trail
          </h1>
          <p className="text-sm text-gray-500 mt-1">Immutable, append-only security and operational action logs.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh Button */}
          <button 
            onClick={() => { fetchLogs(); fetchStats(); }} 
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 text-sm font-semibold transition-all motion-reduce:transition-none disabled:opacity-50"
            aria-label="Refresh Logs"
          >
            <RefreshCw size={14} className={loading ? 'motion-safe:animate-spin' : ''} />
            Refresh
          </button>

          {/* Export Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('csv')}
              disabled={!isSuperAdmin}
              title={isSuperAdmin ? "Export Filtered Logs to CSV" : "Super Admin Privilege Required"}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${
                isSuperAdmin 
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100' 
                  : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Download size={14} />
              Export CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              disabled={!isSuperAdmin}
              title={isSuperAdmin ? "Export Filtered Logs to JSON" : "Super Admin Privilege Required"}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${
                isSuperAdmin 
                  ? 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100' 
                  : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Download size={14} />
              Export JSON
            </button>
          </div>
        </div>
      </header>

      {/* Audit Stats Dashboard Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total */}
        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform motion-reduce:transition-none" />
          <div className="flex items-center gap-4 relative">
            <div className="p-3 bg-indigo-600 text-white rounded-xl">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Records</p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">
                {statsLoading ? '...' : stats.totalLogs.toLocaleString()}
              </h2>
            </div>
          </div>
        </div>

        {/* Card 2: Security */}
        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform motion-reduce:transition-none" />
          <div className="flex items-center gap-4 relative">
            <div className="p-3 bg-rose-600 text-white rounded-xl">
              <ShieldAlert size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Security Events</p>
              <h2 className="text-2xl font-bold text-gray-950 mt-1">
                {statsLoading ? '...' : stats.securityEvents.toLocaleString()}
              </h2>
            </div>
          </div>
        </div>

        {/* Card 3: System */}
        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform motion-reduce:transition-none" />
          <div className="flex items-center gap-4 relative">
            <div className="p-3 bg-purple-600 text-white rounded-xl">
              <Settings size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">System Operations</p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">
                {statsLoading ? '...' : stats.systemActions.toLocaleString()}
              </h2>
            </div>
          </div>
        </div>

        {/* Card 4: Administrative */}
        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform motion-reduce:transition-none" />
          <div className="flex items-center gap-4 relative">
            <div className="p-3 bg-emerald-600 text-white rounded-xl">
              <UserCheck size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin Actions</p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">
                {statsLoading ? '...' : stats.adminActions.toLocaleString()}
              </h2>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Toolbar Section */}
      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Keyword Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search actor email, target details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
            />
          </div>

          {/* Action Filter */}
          <div>
            <select
              value={actionType}
              onChange={(e) => { setActionType(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none bg-white"
            >
              {actionOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Target Type Filter */}
          <div>
            <select
              value={targetType}
              onChange={(e) => { setTargetType(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none bg-white"
            >
              {targetOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none bg-white"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Date Picker Range */}
          <div className="flex items-center gap-1">
            <div className="relative flex-1">
              <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="w-full pl-6 pr-1 py-2 border border-gray-200 rounded-xl text-[10px] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none bg-white text-gray-500"
              />
            </div>
            <span className="text-gray-400 text-[10px]">to</span>
            <div className="relative flex-1">
              <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="w-full pl-6 pr-1 py-2 border border-gray-200 rounded-xl text-[10px] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none bg-white text-gray-500"
              />
            </div>
          </div>
        </form>

        <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-50">
          <button 
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700"
          >
            Clear Filters
          </button>
          <button 
            type="button"
            onClick={handleSearchSubmit}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm shadow-indigo-600/10"
          >
            Apply Filters
          </button>
        </div>
      </section>

      {/* Main Table Grid */}
      <section className="relative">
        {loading ? (
          <div className="flex items-center justify-center h-64 bg-white border border-gray-100 rounded-2xl shadow-sm">
            <div className="motion-safe:animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-14 h-14 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <FileText size={24} />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">No logs found</h3>
            <p className="text-xs text-gray-500 max-w-sm">No administrative changes matched the selected filter criteria.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-4 w-[180px]">Timestamp</th>
                    <th className="p-4 w-[240px]">Actor Account</th>
                    <th className="p-4 w-[160px]">Action Type</th>
                    <th className="p-4 w-[150px]">Target Type</th>
                    <th className="p-4 w-[180px]">Target Reference</th>
                    <th className="p-4 w-[90px]">Status</th>
                    <th className="p-4 w-[110px]">IP Address</th>
                    <th className="p-4 w-[60px] text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-600">
                  {(expandedLogs ? logs : logs.slice(0, 3)).map((log) => (
                    <tr 
                      key={log.id} 
                      onClick={() => handleSelectLog(log)}
                      className="hover:bg-gray-50/40 transition-colors cursor-pointer"
                    >
                      <td className="p-4 font-mono text-[11px] text-gray-500">
                        <time dateTime={log.createdAt}>{new Date(log.createdAt).toLocaleString()}</time>
                      </td>
                      <td className="p-4 font-semibold text-gray-900 truncate">
                        <span className="block">{log.actorEmail}</span>
                        <span className="text-[10px] text-gray-400 font-normal">{log.actorRole}</span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getActionBadgeColor(log.actionType)}`}>
                          {log.actionType}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-gray-700">
                        {log.targetType || 'N/A'}
                      </td>
                      <td className="p-4 font-mono text-[10px] text-gray-500 truncate" title={log.targetName || log.targetId}>
                        {log.targetName || log.targetId || 'N/A'}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold border uppercase ${
                          log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-[11px] text-gray-500">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleSelectLog(log); }}
                          className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors"
                          aria-label="View Details"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* View More Rows Toggle */}
            {logs.length > 3 && (
              <div className="flex justify-center p-3 border-t border-gray-50 bg-gray-50/10">
                <button
                  onClick={() => setExpandedLogs(prev => !prev)}
                  className="text-xs font-bold text-indigo-650 hover:text-indigo-800 py-1.5 px-4 border border-indigo-100 rounded-xl bg-white hover:bg-indigo-50/20 transition-all cursor-pointer shadow-xs"
                >
                  {expandedLogs ? 'View Less Rows' : 'View More Rows'}
                </button>
              </div>
            )}


            {/* Pagination Footer */}
            {pagination.pages > 1 && (
              <footer className="p-4 border-t border-gray-50 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Showing page <span className="font-bold text-gray-800">{pagination.page}</span> of <span className="font-bold text-gray-800">{pagination.pages}</span> ({pagination.total} entries)
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-all motion-reduce:transition-none"
                    aria-label="Previous Page"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={page === pagination.pages}
                    onClick={() => setPage(prev => Math.min(pagination.pages, prev + 1))}
                    className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-all motion-reduce:transition-none"
                    aria-label="Next Page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </footer>
            )}
          </div>
        )}
      </section>

      {/* Details Side-Drawer */}
      {selectedLog && (
        <aside 
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end"
          onClick={() => setSelectedLog(null)}
        >
          <div 
            className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col p-6 space-y-6 overflow-y-auto transform transition-transform motion-safe:translate-x-0 motion-reduce:transition-none"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Drawer Header */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-indigo-600 w-5 h-5" />
                <h3 className="text-base font-bold text-gray-900">Audit Log Details</h3>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close details"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body - Attributes Grid */}
            <div className="flex-1 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-50">
                <span className="text-gray-400 font-medium">Log Entry ID</span>
                <span className="col-span-2 font-mono text-gray-700 break-all select-all">{selectedLog.id}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-50">
                <span className="text-gray-400 font-medium">Action Timestamp</span>
                <span className="col-span-2 text-gray-700">
                  {new Date(selectedLog.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-50">
                <span className="text-gray-400 font-medium">Actor Account</span>
                <div className="col-span-2">
                  <p className="font-semibold text-gray-900">{selectedLog.actorEmail}</p>
                  <p className="text-[10px] text-gray-400 font-mono">ID: {selectedLog.actorId}</p>
                  <p className="text-[10px] text-indigo-600 font-bold mt-0.5">{selectedLog.actorRole}</p>
                </div>
              </div>

              {showAllDetails ? (
                <>
                  <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-50">
                    <span className="text-gray-400 font-medium">Action Triggered</span>
                    <span className="col-span-2">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full font-bold border text-[10px] ${getActionBadgeColor(selectedLog.actionType)}`}>
                        {selectedLog.actionType}
                      </span>
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-50">
                    <span className="text-gray-400 font-medium">Target Reference</span>
                    <div className="col-span-2 space-y-1">
                      <p className="font-medium text-gray-800">Type: <span className="text-indigo-600">{selectedLog.targetType || 'N/A'}</span></p>
                      <p className="font-semibold text-gray-900">Name: {selectedLog.targetName || 'N/A'}</p>
                      <p className="font-mono text-[10px] text-gray-400 break-all">ID/Ref: {selectedLog.targetId || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-50">
                    <span className="text-gray-400 font-medium">Transaction Status</span>
                    <span className="col-span-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] border ${
                        selectedLog.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {selectedLog.status === 'SUCCESS' ? <ShieldCheck size={12} /> : <AlertTriangle size={12} />}
                        {selectedLog.status}
                      </span>
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-50">
                    <span className="text-gray-400 font-medium">Network Context</span>
                    <div className="col-span-2 space-y-1">
                      <p className="font-mono text-gray-700">IP: {selectedLog.ipAddress || '127.0.0.1'}</p>
                      <p className="text-gray-500 font-mono text-[10px]">
                        Route: <span className="text-indigo-500 font-bold uppercase">{selectedLog.requestMethod}</span> {selectedLog.endpoint}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-50">
                    <span className="text-gray-400 font-medium">Client User Agent</span>
                    <span className="col-span-2 font-mono text-[10px] text-gray-500 break-all bg-gray-50 p-2 border border-gray-100 rounded-xl leading-relaxed">
                      {selectedLog.userAgent || 'Unknown Client'}
                    </span>
                  </div>

                  <div className="flex justify-center pt-2">
                    <button
                      onClick={() => setShowAllDetails(false)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-850 flex items-center gap-1.5 cursor-pointer py-1"
                    >
                      View Less Details
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => setShowAllDetails(true)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-850 flex items-center gap-1.5 cursor-pointer py-1"
                  >
                    View More Details
                  </button>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors text-xs"
              >
                Close Details
              </button>
            </div>
          </div>
        </aside>
      )}
    </main>
  );
};

