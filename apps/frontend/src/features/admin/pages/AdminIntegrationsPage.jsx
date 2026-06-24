import React, { useEffect, useState } from 'react';
import { 
  Boxes, Key, Cpu, Radio, Database, Activity, RefreshCw, 
  Mail, Play, Server, AlertCircle, CheckCircle2, ShieldAlert,
  Send, X, Search, Clock
} from 'lucide-react';
import { adminService } from '../services/admin.service.js';
import { useAuthStore } from '../../../store/auth.store.js';
import { toast } from 'sonner';

export const AdminIntegrationsPage = () => {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.email === 'shabanahaneef10@gmail.com';

  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [testingService, setTestingService] = useState('');
  const [selectedLogsService, setSelectedLogsService] = useState('');

  // SMTP modal state
  const [showSmtpModal, setShowSmtpModal] = useState(false);
  const [smtpTargetEmail, setSmtpTargetEmail] = useState('');

  useEffect(() => {
    fetchHealthReport();
    fetchLogs();
  }, []);

  const fetchHealthReport = async () => {
    try {
      setLoading(true);
      const res = await adminService.getHealth();
      if (res?.data?.diagnostics) {
        setHealthData(res.data.diagnostics);
      }
    } catch (e) {
      toast.error('Failed to load system diagnostics report');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (service = selectedLogsService) => {
    try {
      setLogsLoading(true);
      const res = await adminService.getIntegrationLogs(service);
      if (res?.data?.logs) {
        setLogs(res.data.logs);
      }
    } catch (e) {
      console.error('Failed to load integration logs', e);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleLogsServiceChange = (e) => {
    const val = e.target.value;
    setSelectedLogsService(val);
    fetchLogs(val);
  };

  const handleTestConnection = async (serviceName, emailPayload = null) => {
    if (serviceName === 'smtp' && !isSuperAdmin) {
      toast.error('Only the Super Admin is authorized to run SMTP connection tests.');
      return;
    }

    try {
      setTestingService(serviceName);
      toast.loading(`Testing connection to ${serviceName.toUpperCase()}...`, { id: 'test-toast' });
      
      const payload = emailPayload ? { targetEmail: emailPayload } : {};
      const res = await adminService.testConnection(serviceName, payload);
      
      if (res?.success || res?.status === 'HEALTHY') {
        toast.success(`${serviceName.toUpperCase()} connection test successful!`, { id: 'test-toast' });
      } else {
        toast.warning(`${serviceName.toUpperCase()} test completed: Warning status returned.`, { id: 'test-toast' });
      }
      
      // Refresh diagnostics and log stream
      fetchHealthReport();
      fetchLogs();
    } catch (e) {
      toast.error(e.response?.data?.message || `Failed connection test for ${serviceName.toUpperCase()}`, { id: 'test-toast' });
    } finally {
      setTestingService('');
    }
  };

  const openSmtpModal = () => {
    if (!isSuperAdmin) {
      toast.error('Only the Super Admin can test SMTP email triggers.');
      return;
    }
    setSmtpTargetEmail(user?.email || '');
    setShowSmtpModal(true);
  };

  const triggerSmtpTest = (e) => {
    e.preventDefault();
    if (!smtpTargetEmail) {
      toast.error('Please enter a valid target email address');
      return;
    }
    setShowSmtpModal(false);
    handleTestConnection('smtp', smtpTargetEmail);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'HEALTHY':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={10} /> Active
          </span>
        );
      case 'WARNING':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle size={10} /> Simulated
          </span>
        );
      case 'DOWN':
      default:
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <ShieldAlert size={10} /> Offline
          </span>
        );
    }
  };

  const getLatencyIndicator = (ms) => {
    if (ms === undefined || ms === null) return 'N/A';
    const color = ms < 200 ? 'text-emerald-500' : ms < 600 ? 'text-amber-500' : 'text-rose-500';
    return (
      <span className={`font-mono text-xs font-semibold ${color} flex items-center gap-1`}>
        <Clock size={12} /> {ms}ms
      </span>
    );
  };

  // Define local services structure mapping
  const servicesConfig = {
    database: {
      name: 'PostgreSQL Database',
      desc: 'Primary transactional system database engine storing marketplace data records.',
      icon: <Database className="text-blue-600 w-5 h-5" />,
      type: 'Core Infrastructure',
      testable: false,
      renderDetails: (details) => (
        <div className="text-[10px] text-gray-400 space-y-1">
          <p>Connections: <span className="font-bold text-gray-700">{details?.activeConnections || 1} active</span></p>
          <p>Storage engine: <span className="font-semibold text-gray-700">Relational DB</span></p>
        </div>
      )
    },
    redis: {
      name: 'Redis Cache Layer',
      desc: 'In-memory data structure cache layer, distributed lock client, and request throttlers.',
      icon: <Radio className="text-purple-600 w-5 h-5" />,
      type: 'Performance Caching',
      testable: false,
      renderDetails: (details) => (
        <div className="text-[10px] text-gray-400 space-y-1">
          <p>Memory Usage: <span className="font-bold text-gray-700">{details?.memoryUsage || 'N/A'}</span></p>
          <p>Clients prefix: <span className="font-semibold text-gray-700">cravo:*</span></p>
        </div>
      )
    },
    smtp: {
      name: 'Resend SMTP Gateway',
      desc: 'Outbound transaction email notifications, password resets, and verification OTPs.',
      icon: <Mail className="text-indigo-600 w-5 h-5" />,
      type: 'Communications',
      testable: true,
      testAction: openSmtpModal,
      renderDetails: (details) => (
        <div className="text-[10px] text-gray-400 space-y-1">
          <p>Status: <span className="font-bold text-gray-700">{details?.deliveryStatus || 'Inactive'}</span></p>
          <p>Last sent: <span className="font-semibold text-gray-700">{details?.lastEmailSent ? new Date(details.lastEmailSent).toLocaleString() : 'Never'}</span></p>
        </div>
      )
    },
    cloudinary: {
      name: 'Cloudinary CDN',
      desc: 'Image upload gateway pipelines, real-time transformations, and resource distribution.',
      icon: <Cpu className="text-emerald-600 w-5 h-5" />,
      type: 'Media Storage & CDN',
      testable: true,
      testAction: () => handleTestConnection('cloudinary'),
      renderDetails: (details) => (
        <div className="text-[10px] text-gray-400 space-y-1">
          <p>Delivery: <span className="font-bold text-gray-700">{details?.uploadStatus || 'Inactive'}</span></p>
          <p>Provider: <span className="font-semibold text-gray-700">Cloudinary SaaS</span></p>
        </div>
      )
    },
    razorpay: {
      name: 'Razorpay Gateway',
      desc: 'Payment processing APIs, client orders, and checkout verification endpoints.',
      icon: <Key className="text-cyan-600 w-5 h-5" />,
      type: 'Payment Processing',
      testable: true,
      testAction: () => handleTestConnection('razorpay'),
      renderDetails: (details) => (
        <div className="text-[10px] text-gray-400 space-y-1">
          <p>Webhook: <span className="font-bold text-gray-700">{details?.webhookStatus || 'Inactive'}</span></p>
          <p>Last success: <span className="font-semibold text-gray-700">{details?.lastTransaction ? new Date(details.lastTransaction).toLocaleString() : 'N/A'}</span></p>
        </div>
      )
    },
    delhivery: {
      name: 'Delhivery Logistics',
      desc: 'Shipping cost estimations, waybill generation, and shipment status pings.',
      icon: <Boxes className="text-orange-600 w-5 h-5" />,
      type: 'Shipping & Logistics',
      testable: true,
      testAction: () => handleTestConnection('delhivery'),
      renderDetails: (details) => (
        <div className="text-[10px] text-gray-400 space-y-1">
          <p>API Sync: <span className="font-bold text-gray-700">{details?.trackingSyncStatus || 'Inactive'}</span></p>
          <p>Last manifest: <span className="font-semibold text-gray-700">{details?.lastShipmentCreated ? new Date(details.lastShipmentCreated).toLocaleString() : 'N/A'}</span></p>
        </div>
      )
    },
    websocket: {
      name: 'Socket.io WebSockets',
      desc: 'Real-time notification triggers, dashboard status pings, and client chats.',
      icon: <Server className="text-amber-600 w-5 h-5" />,
      type: 'Pub/Sub Events',
      testable: false,
      renderDetails: (details) => (
        <div className="text-[10px] text-gray-400 space-y-1">
          <p>Active sockets: <span className="font-bold text-gray-700">{details?.activeConnections || 0} clients</span></p>
          <p>Processed events: <span className="font-semibold text-gray-700">{details?.eventsProcessed || 0}</span></p>
        </div>
      )
    },
    queue: {
      name: 'Queue Bull Workers',
      desc: 'Asynchronous backend job managers, email pings, and cron processes.',
      icon: <Activity className="text-teal-600 w-5 h-5" />,
      type: 'Background Queues',
      testable: false,
      renderDetails: (details) => (
        <div className="text-[10px] text-gray-400 space-y-1">
          <p>Running: <span className="font-bold text-gray-700">{details?.runningJobs || 0} tasks</span></p>
          <p>Failed: <span className="font-semibold text-rose-600">{details?.failedJobs || 0} jobs</span></p>
        </div>
      )
    }
  };

  return (
    <main className="max-w-[1600px] mx-auto p-4 space-y-6 md:p-6 lg:p-8">
      {/* Page Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Boxes className="text-indigo-600 w-6 h-6 motion-safe:animate-pulse" />
            Integrations Monitor
          </h1>
          <p className="text-sm text-gray-500 mt-1">Real-time connection metrics, diagnostic status, and integrations health.</p>
        </div>

        <button 
          onClick={fetchHealthReport} 
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 text-sm font-semibold transition-all disabled:opacity-50"
          aria-label="Refresh Health Report"
        >
          <RefreshCw size={14} className={loading ? 'motion-safe:animate-spin' : ''} />
          Diagnostics Ping
        </button>
      </header>

      {/* Grid containing 8 integrations status cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(servicesConfig).map(([key, config]) => {
          const serviceHealth = healthData ? healthData[key] : null;
          const isTesting = testingService === key;

          return (
            <article 
              key={key} 
              className="bg-white border border-gray-100 rounded-2xl shadow-xs p-6 flex flex-col justify-between hover:border-gray-200 transition-colors"
            >
              <div className="space-y-4">
                {/* Status Badge + Service Type */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                      {config.icon}
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-900 text-sm">{config.name}</h2>
                      <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider">{config.type}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-500 leading-relaxed min-h-[48px]">{config.desc}</p>
                
                {/* Specific stats */}
                <div className="pt-2 border-t border-gray-50">
                  {config.renderDetails(serviceHealth?.details)}
                </div>
              </div>

              {/* Card Footer: Status Indicators + Test Trigger */}
              <div className="flex justify-between items-center pt-4 mt-6 border-t border-gray-50">
                <div className="space-y-1">
                  {getStatusBadge(serviceHealth?.status || 'HEALTHY')}
                  {serviceHealth?.responseTime !== undefined && (
                    <div className="mt-1">{getLatencyIndicator(serviceHealth.responseTime)}</div>
                  )}
                </div>
                
                {config.testable && (
                  <button 
                    onClick={config.testAction}
                    disabled={isTesting || (key === 'smtp' && !isSuperAdmin)}
                    title={key === 'smtp' && !isSuperAdmin ? 'Super Admin only' : `Trigger connection diagnostics test for ${key}`}
                    className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold transition-all ${
                      isTesting
                        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-wait'
                        : (key === 'smtp' && !isSuperAdmin)
                        ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                        : 'border-indigo-100 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    }`}
                  >
                    {isTesting ? (
                      <RefreshCw size={12} className="motion-safe:animate-spin" />
                    ) : (
                      <Play size={12} />
                    )}
                    Test
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </section>

      {/* Integration Event Logs Section */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden space-y-4 p-6">
        <header className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-gray-50 pb-4 gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Activity className="text-indigo-600 w-5 h-5" />
              Connection Diagnostics Log Stream
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Audit log trail of connection events and integration pings.</p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedLogsService}
              onChange={handleLogsServiceChange}
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none bg-white text-gray-700"
            >
              <option value="">All Services</option>
              <option value="Database">Database</option>
              <option value="Redis">Redis Cache</option>
              <option value="SMTP">SMTP Provider</option>
              <option value="Cloudinary">Cloudinary CDN</option>
              <option value="Razorpay">Razorpay Checkout</option>
              <option value="Delhivery">Delhivery Shipping</option>
            </select>

            <button 
              onClick={() => fetchLogs()} 
              disabled={logsLoading}
              className="p-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              aria-label="Refresh Logs Stream"
            >
              <RefreshCw size={14} className={logsLoading ? 'motion-safe:animate-spin' : ''} />
            </button>
          </div>
        </header>

        {logsLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="motion-safe:animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-xs">
            No connection event logs found. Try triggering a connection test.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="p-3 w-[200px]">Timestamp</th>
                  <th className="p-3 w-[150px]">Service</th>
                  <th className="p-3 w-[300px]">Event Description</th>
                  <th className="p-3 w-[120px]">Status Badge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-600 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/20 transition-colors">
                    <td className="p-3 text-[11px] text-gray-500">
                      <time dateTime={log.timestamp}>{new Date(log.timestamp).toLocaleString()}</time>
                    </td>
                    <td className="p-3 font-semibold text-gray-900">{log.service}</td>
                    <td className="p-3 text-gray-700 truncate" title={log.event}>{log.event}</td>
                    <td className="p-3 text-[10px]">
                      <span className={`inline-flex px-2 py-0.5 rounded-full font-bold border ${
                        log.status === 'HEALTHY' || log.status === 'UP' || log.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : log.status === 'WARNING'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* SMTP Email Target Modal Popup */}
      {showSmtpModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowSmtpModal(false)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-gray-50">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Send className="text-indigo-600 w-4 h-4" />
                SMTP Delivery Test
              </h3>
              <button 
                onClick={() => setShowSmtpModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
            
            <p className="text-xs text-gray-500 leading-relaxed">
              Send a system-generated test verification email to confirm the SMTP credentials, Resend key endpoints, and DNS records are fully operational.
            </p>

            <form onSubmit={triggerSmtpTest} className="space-y-4">
              <div>
                <label htmlFor="target-email" className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Target Email Address</label>
                <input
                  id="target-email"
                  type="email"
                  placeholder="name@domain.com"
                  required
                  value={smtpTargetEmail}
                  onChange={(e) => setSmtpTargetEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSmtpModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 font-semibold rounded-xl text-xs hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-700 shadow-sm shadow-indigo-600/10"
                >
                  Trigger Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

