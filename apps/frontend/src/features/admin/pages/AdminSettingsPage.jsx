import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, Store, ShoppingCart, CreditCard, Truck, Database, Bell, Shield, 
  Link2, Flag, Wrench, Info, Paintbrush, MapPin, Briefcase, Sliders, 
  Clock, Mail, Zap, ChevronRight, ChevronDown, Check, Calendar, Activity, 
  RotateCw, Lock, FileText, Globe, Download, X, Loader2, AlertTriangle
} from 'lucide-react';
import { adminService } from '../services/admin.service.js';
import { useAuthStore } from '../../../store/auth.store.js';
import { toast } from 'sonner';

export const AdminSettingsPage = () => {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.email === 'shabanahaneef10@gmail.com';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const navigate = useNavigate();

  // Quick Actions modal states
  const [activeModal, setActiveModal] = useState(null);
  const [showClearCacheModal, setShowClearCacheModal] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);

  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backups, setBackups] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);

  const [showHealthModal, setShowHealthModal] = useState(false);
  const [healthData, setHealthData] = useState([]);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // Order Settings States
  const [loadingOrderSettings, setLoadingOrderSettings] = useState(false);
  const [orderSettings, setOrderSettings] = useState({
    autoCancelUnconfirmedMins: 30,
    autoCompleteDeliveredDays: 7,
    allowCustomerCancellation: true,
    customerCancellationWindowMins: 30,
    allowedTransitions: {
      'PLACED': ['CONFIRMED', 'CANCELLED'],
      'CONFIRMED': ['PREPARING'],
      'PREPARING': ['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'],
      'READY_FOR_PICKUP': ['DELIVERED'],
      'OUT_FOR_DELIVERY': ['DELIVERED']
    },
    minOrderValue: 50,
    maxOrderValue: 50000,
    maxItemsPerOrder: 100,
    maxQtyPerProduct: 20,
    requireVerifiedEmail: false,
    requireActiveAddress: false,
    blockSuspendedUsers: true,
    allowGuestOrders: false,
    autoExpireSellerAcceptanceMins: 60,
    sellerAcceptanceAction: 'CANCEL',
    allowRefundRequests: true,
    refundRequestWindowDays: 7,
    requireAdminRefundApproval: true
  });

  // Delivery Settings States
  const [loadingDeliverySettings, setLoadingDeliverySettings] = useState(false);
  const [deliverySettings, setDeliverySettings] = useState({
    enableDeliveryOrders: true,
    enablePickupOrders: true,
    enableScheduledDeliveries: false,
    restrictOutsideKerala: true,
    allowFutureStateExpansion: false,
    enableDeliveryCharges: true,
    defaultDeliveryCharge: 50,
    freeDeliveryThreshold: 499,
    allowPromotionalFreeDelivery: true,
    expectedDispatchTime: '24 Hours',
    standardDeliveryTime: '1-3 Business Days',
    remoteAreaDeliveryTime: '3-5 Business Days',
    displayEstimatesToCustomers: true,
    defaultSellerPrepTime: '24 Hours',
    maxSellerPrepTime: '72 Hours',
    autoCancelUnfulfilledOrders: false,
    autoCancelWindowDays: 7,
    autoCreateShipment: true,
    autoSyncTracking: true,
    trackingSyncIntervalMins: 30,
    enablePickupVerification: true,
    requirePickupOtp: true,
    pickupExpiryWindowHours: 24,
    requireVerifiedAddress: true,
    requireDefaultAddress: true,
    allowAddressChanges: false,
    maxAddressModificationWindowMins: 30
  });

  const [loadingDeliveryAnalytics, setLoadingDeliveryAnalytics] = useState(false);
  const [deliveryAnalytics, setDeliveryAnalytics] = useState({
    totalDeliveries: 0,
    successfulDeliveries: 0,
    failedDeliveries: 0,
    averageDeliveryTime: '0 Hours',
    lateDeliveries: 0,
    activeShipments: 0,
    delhiverySuccessRate: '100%'
  });

  const [loadingDelhiveryInfo, setLoadingDelhiveryInfo] = useState(false);
  const [delhiveryInfo, setDelhiveryInfo] = useState({
    connectionStatus: 'HEALTHY',
    shipmentApiStatus: 'HEALTHY',
    trackingApiStatus: 'HEALTHY',
    lastSuccessfulShipment: null,
    lastSuccessfulTrackingSync: null,
    averageResponseTime: '0 ms'
  });

  const [testingConnection, setTestingConnection] = useState(false);

  // Governance Settings States
  const [loadingGovernanceSettings, setLoadingGovernanceSettings] = useState(false);
  const [governanceSettings, setGovernanceSettings] = useState({
    requireSellerApproval: true,
    requireSellerDocumentVerification: true,
    allowSellerReapplication: true,
    requireProductApproval: true,
    reapproveAfterProductUpdate: true,
    allowProductDrafts: true,
    requireEmailVerification: true,
    blockSuspendedUsers: true,
    allowNewCustomerRegistrations: true,
    allowNewSellerApplications: true,
    allowNewProductSubmissions: true
  });

  const [loadingMarketplaceHealth, setLoadingMarketplaceHealth] = useState(false);
  const [marketplaceHealth, setMarketplaceHealth] = useState({
    totalCustomers: 0,
    totalSellers: 0,
    activeSellers: 0,
    pendingSellerApplications: 0,
    pendingProductApprovals: 0,
    suspendedUsers: 0
  });

  // Payment Settings States
  const [loadingPaymentSettings, setLoadingPaymentSettings] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState({
    enableRazorpay: true,
    enableCod: false,
    maxCodAmount: 2000,
    minOrderAmount: 50,
    maxOrderAmount: 50000,
    maxSingleTransactionAmount: 50000,
    enableRefundRequests: true,
    refundRequestWindowDays: 7,
    requireAdminRefundApproval: true,
    autoRefundProcessing: false,
    commissionType: 'Percentage',
    commissionValue: 10,
    applyCommissionOn: 'Product Total',
    enableSellerPayouts: true,
    minPayoutThreshold: 500,
    payoutReleaseDelayDays: 7,
    autoPayoutProcessing: false,
    maxFailedPaymentAttempts: 5,
    manualReviewThreshold: 10000,
    blockExcessiveFailedAttempts: true
  });

  const [loadingPaymentHealth, setLoadingPaymentHealth] = useState(false);
  const [paymentHealth, setPaymentHealth] = useState({
    razorpayStatus: 'Healthy',
    webhookStatus: 'Active',
    lastSuccessfulPayment: null,
    paymentSuccessRate: '100%',
    paymentFailureRate: '0%',
    averageVerificationTime: '350 ms'
  });

  // Inventory Settings States
  const [loadingInventorySettings, setLoadingInventorySettings] = useState(false);
  const [inventorySettings, setInventorySettings] = useState({
    enableLowStockAlerts: true,
    defaultLowStockThreshold: 10,
    criticalStockThreshold: 5,
    enableStockReservation: true,
    reservationExpiryTime: 30,
    autoReleaseExpiredReservations: true,
    allowPurchaseWhenOutOfStock: false,
    showOutOfStockProducts: true,
    hideProductsAfterStockReachesZero: false,
    allowSellerInventoryUpdates: true,
    requireInventoryChangeLogging: true,
    requireReasonForManualAdjustment: true,
    trackVariantInventorySeparately: true,
    preventOversellingVariants: true,
    requireVariantStockBeforeListing: true,
    enableLowStockNotifications: true,
    enableCriticalStockNotifications: true,
    notificationFrequency: 'Instant',
    enableInventoryLogs: true,
    logRetentionPeriod: 365,
    validateStockBeforePaymentVerification: true,
    preventNegativeStock: true,
    preventOverselling: true,
    blockOrdersWithInsufficientStock: true
  });

  const [loadingInventoryHealth, setLoadingInventoryHealth] = useState(false);
  const [inventoryHealth, setInventoryHealth] = useState({
    totalProducts: 0,
    activeProducts: 0,
    outOfStockProducts: 0,
    lowStockProducts: 0,
    criticalStockProducts: 0,
    reservedInventoryCount: 0,
    inventoryTransactionsToday: 0
  });

  const [cardStatus, setCardStatus] = useState({
    lifecycle: { loading: false, success: false, error: null },
    transitions: { loading: false, success: false, error: null },
    limits: { loading: false, success: false, error: null },
    protection: { loading: false, success: false, error: null },
    seller: { loading: false, success: false, error: null },
    refund: { loading: false, success: false, error: null },
    // Delivery Cards
    deliveryModes: { loading: false, success: false, error: null },
    deliveryCoverage: { loading: false, success: false, error: null },
    deliveryCharges: { loading: false, success: false, error: null },
    deliveryEstimates: { loading: false, success: false, error: null },
    fulfillmentRules: { loading: false, success: false, error: null },
    shipmentAutomation: { loading: false, success: false, error: null },
    pickupSettings: { loading: false, success: false, error: null },
    customerRules: { loading: false, success: false, error: null },
    // Governance Cards
    sellerGovernance: { loading: false, success: false, error: null },
    productGovernance: { loading: false, success: false, error: null },
    customerRulesCard: { loading: false, success: false, error: null },
    marketplaceAccess: { loading: false, success: false, error: null },
    // Payment Cards
    paymentMethods: { loading: false, success: false, error: null },
    paymentLimits: { loading: false, success: false, error: null },
    refundSettings: { loading: false, success: false, error: null },
    platformCommission: { loading: false, success: false, error: null },
    sellerPayoutRules: { loading: false, success: false, error: null },
    fraudProtection: { loading: false, success: false, error: null },
    // Inventory Cards
    lowStockRules: { loading: false, success: false, error: null },
    stockReservation: { loading: false, success: false, error: null },
    outOfStockRules: { loading: false, success: false, error: null },
    sellerControls: { loading: false, success: false, error: null },
    variantInventory: { loading: false, success: false, error: null },
    inventoryAlerts: { loading: false, success: false, error: null },
    inventoryLogs: { loading: false, success: false, error: null },
    protectionRules: { loading: false, success: false, error: null }
  });

  const fetchOrderSettings = async () => {
    try {
      setLoadingOrderSettings(true);
      const res = await adminService.getOrderSettings();
      if (res?.data?.settings) {
        setOrderSettings(res.data.settings);
      }
    } catch (e) {
      toast.error('Failed to load order settings');
    } finally {
      setLoadingOrderSettings(false);
    }
  };

  const fetchDeliverySettings = async () => {
    try {
      setLoadingDeliverySettings(true);
      const res = await adminService.getDeliverySettings();
      if (res?.data?.settings) {
        setDeliverySettings(res.data.settings);
      }
    } catch (e) {
      toast.error('Failed to load delivery settings');
    } finally {
      setLoadingDeliverySettings(false);
    }
  };

  const fetchDeliveryAnalytics = async () => {
    try {
      setLoadingDeliveryAnalytics(true);
      const res = await adminService.getDeliveryAnalytics();
      if (res?.data?.analytics) {
        setDeliveryAnalytics(res.data.analytics);
      }
    } catch (e) {
      toast.error('Failed to load delivery analytics');
    } finally {
      setLoadingDeliveryAnalytics(false);
    }
  };

  const fetchDelhiveryInfo = async () => {
    try {
      setLoadingDelhiveryInfo(true);
      const res = await adminService.getDelhiveryIntegrationInfo();
      if (res?.data?.info) {
        setDelhiveryInfo(res.data.info);
      }
    } catch (e) {
      toast.error('Failed to load Delhivery integration details');
    } finally {
      setLoadingDelhiveryInfo(false);
    }
  };

  const fetchGovernanceSettings = async () => {
    try {
      setLoadingGovernanceSettings(true);
      const res = await adminService.getGovernanceSettings();
      if (res?.data?.settings) {
        setGovernanceSettings(res.data.settings);
      }
    } catch (e) {
      toast.error('Failed to load governance settings');
    } finally {
      setLoadingGovernanceSettings(false);
    }
  };

  const fetchMarketplaceHealth = async () => {
    try {
      setLoadingMarketplaceHealth(true);
      const res = await adminService.getMarketplaceHealth();
      if (res?.data?.health) {
        setMarketplaceHealth(res.data.health);
      }
    } catch (e) {
      toast.error('Failed to load marketplace health metrics');
    } finally {
      setLoadingMarketplaceHealth(false);
    }
  };

  const handleSaveCard = async (cardName) => {
    if (!isSuperAdmin) {
      toast.error('Only the Super Admin is authorized to modify settings.');
      return;
    }

    try {
      setCardStatus(prev => ({
        ...prev,
        [cardName]: { ...prev[cardName], loading: true, error: null, success: false }
      }));

      const res = await adminService.updateOrderSettings(orderSettings);
      if (res?.data?.settings) {
        setOrderSettings(res.data.settings);
      }

      setCardStatus(prev => ({
        ...prev,
        [cardName]: { loading: false, error: null, success: true }
      }));
      toast.success('Settings saved successfully!');

      setTimeout(() => {
        setCardStatus(prev => ({
          ...prev,
          [cardName]: { ...prev[cardName], success: false }
        }));
      }, 3000);
    } catch (e) {
      const errMsg = e.response?.data?.message || 'Failed to save settings.';
      setCardStatus(prev => ({
        ...prev,
        [cardName]: { loading: false, error: errMsg, success: false }
      }));
      toast.error(errMsg);
    }
  };

  const handleSaveDeliveryCard = async (cardName) => {
    if (!isSuperAdmin) {
      toast.error('Only the Super Admin is authorized to modify settings.');
      return;
    }

    try {
      setCardStatus(prev => ({
        ...prev,
        [cardName]: { ...prev[cardName], loading: true, error: null, success: false }
      }));

      // Validation checks
      if (cardName === 'deliveryCharges') {
        const threshold = parseFloat(deliverySettings.freeDeliveryThreshold);
        const charge = parseFloat(deliverySettings.defaultDeliveryCharge);
        if (isNaN(charge) || charge < 0 || charge > 1000) {
          throw new Error('Default Delivery Charge must be between ₹0 and ₹1000.');
        }
        if (isNaN(threshold) || threshold < 0) {
          throw new Error('Free Delivery Threshold must be a non-negative number.');
        }
        if (threshold <= charge) {
          throw new Error('Free Delivery Threshold must be greater than the Default Delivery Charge.');
        }
      }

      if (cardName === 'shipmentAutomation') {
        const interval = parseInt(deliverySettings.trackingSyncIntervalMins);
        if (isNaN(interval) || interval < 5 || interval > 1440) {
          throw new Error('Tracking Sync Interval must be between 5 minutes and 24 hours.');
        }
      }

      const res = await adminService.updateDeliverySettings(deliverySettings);
      if (res?.data?.settings) {
        setDeliverySettings(res.data.settings);
      }

      setCardStatus(prev => ({
        ...prev,
        [cardName]: { loading: false, error: null, success: true }
      }));
      toast.success('Settings saved successfully!');

      setTimeout(() => {
        setCardStatus(prev => ({
          ...prev,
          [cardName]: { ...prev[cardName], success: false }
        }));
      }, 3000);
    } catch (e) {
      const errMsg = e.message || e.response?.data?.message || 'Failed to save settings.';
      setCardStatus(prev => ({
        ...prev,
        [cardName]: { loading: false, error: errMsg, success: false }
      }));
      toast.error(errMsg);
    }
  };

  const handleTestDelhiveryConnection = async () => {
    if (!isSuperAdmin) {
      toast.error('Only the Super Admin is authorized to test integration connectivity.');
      return;
    }

    try {
      setTestingConnection(true);
      const res = await adminService.testConnection('delhivery');
      toast.success(`Connection status: ${res.data?.status || 'HEALTHY'}`);
      await fetchDelhiveryInfo();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delhivery connection test failed.');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveGovernanceCard = async (cardName) => {
    if (!isSuperAdmin) {
      toast.error('Only the Super Admin is authorized to modify settings.');
      return;
    }

    try {
      setCardStatus(prev => ({
        ...prev,
        [cardName]: { ...prev[cardName], loading: true, error: null, success: false }
      }));

      const res = await adminService.updateGovernanceSettings(governanceSettings);
      if (res?.data?.settings) {
        setGovernanceSettings(res.data.settings);
      }

      setCardStatus(prev => ({
        ...prev,
        [cardName]: { loading: false, error: null, success: true }
      }));
      toast.success('Settings saved successfully!');

      setTimeout(() => {
        setCardStatus(prev => ({
          ...prev,
          [cardName]: { ...prev[cardName], success: false }
        }));
      }, 3000);
    } catch (e) {
      const errMsg = e.response?.data?.message || 'Failed to save settings.';
      setCardStatus(prev => ({
        ...prev,
        [cardName]: { loading: false, error: errMsg, success: false }
      }));
      toast.error(errMsg);
    }
  };

  const fetchPaymentSettings = async () => {
    try {
      setLoadingPaymentSettings(true);
      const res = await adminService.getPaymentSettings();
      if (res?.data?.settings) {
        setPaymentSettings(res.data.settings);
      }
    } catch (e) {
      toast.error('Failed to load payment settings');
    } finally {
      setLoadingPaymentSettings(false);
    }
  };

  const fetchPaymentHealth = async () => {
    try {
      setLoadingPaymentHealth(true);
      const res = await adminService.getPaymentHealth();
      if (res?.data?.health) {
        setPaymentHealth(res.data.health);
      }
    } catch (e) {
      toast.error('Failed to load payment health stats');
    } finally {
      setLoadingPaymentHealth(false);
    }
  };

  const handleSavePaymentCard = async (cardName) => {
    if (!isSuperAdmin) {
      toast.error('Only the Super Admin is authorized to modify settings.');
      return;
    }

    try {
      setCardStatus(prev => ({
        ...prev,
        [cardName]: { ...prev[cardName], loading: true, error: null, success: false }
      }));

      // Validation checks
      if (cardName === 'paymentMethods') {
        if (paymentSettings.enableCod) {
          const maxCodAmount = Number(paymentSettings.maxCodAmount);
          if (isNaN(maxCodAmount) || maxCodAmount < 1 || maxCodAmount > 50000) {
            throw new Error('Maximum COD Order Amount must be between ₹1 and ₹50,000.');
          }
        }
      }

      if (cardName === 'paymentLimits') {
        const minOrderAmount = Number(paymentSettings.minOrderAmount);
        const maxOrderAmount = Number(paymentSettings.maxOrderAmount);
        const maxSingleTransactionAmount = Number(paymentSettings.maxSingleTransactionAmount);

        if (isNaN(minOrderAmount) || minOrderAmount < 0) {
          throw new Error('Minimum Order Amount must be a non-negative number.');
        }
        if (isNaN(maxOrderAmount) || maxOrderAmount <= 0) {
          throw new Error('Maximum Order Amount must be a positive number.');
        }
        if (minOrderAmount > maxOrderAmount) {
          throw new Error('Minimum Order Amount cannot exceed Maximum Order Amount.');
        }
        if (isNaN(maxSingleTransactionAmount) || maxSingleTransactionAmount <= 0) {
          throw new Error('Maximum Single Transaction Amount must be a positive number.');
        }
      }

      if (cardName === 'refundSettings') {
        const refundRequestWindowDays = Number(paymentSettings.refundRequestWindowDays);
        if (isNaN(refundRequestWindowDays) || refundRequestWindowDays < 1 || refundRequestWindowDays > 30) {
          throw new Error('Refund Request Window must be between 1 and 30 days.');
        }
      }

      if (cardName === 'platformCommission') {
        const commissionValue = Number(paymentSettings.commissionValue);
        if (isNaN(commissionValue) || commissionValue < 0) {
          throw new Error('Commission Value must be a non-negative number.');
        }
        if (paymentSettings.commissionType === 'Percentage' && commissionValue > 100) {
          throw new Error('Percentage Commission cannot exceed 100%.');
        }
      }

      if (cardName === 'sellerPayoutRules') {
        const minPayoutThreshold = Number(paymentSettings.minPayoutThreshold);
        if (isNaN(minPayoutThreshold) || minPayoutThreshold < 0) {
          throw new Error('Minimum Payout Threshold must be a non-negative number.');
        }
        const payoutReleaseDelayDays = Number(paymentSettings.payoutReleaseDelayDays);
        if (isNaN(payoutReleaseDelayDays) || payoutReleaseDelayDays < 0) {
          throw new Error('Payout Release Delay must be a non-negative number.');
        }
      }

      if (cardName === 'fraudProtection') {
        const maxFailedPaymentAttempts = Number(paymentSettings.maxFailedPaymentAttempts);
        if (isNaN(maxFailedPaymentAttempts) || maxFailedPaymentAttempts <= 0) {
          throw new Error('Maximum Failed Payment Attempts must be a positive number.');
        }
        const manualReviewThreshold = Number(paymentSettings.manualReviewThreshold);
        if (isNaN(manualReviewThreshold) || manualReviewThreshold < 0) {
          throw new Error('Manual Review Threshold must be a non-negative number.');
        }
      }

      const res = await adminService.updatePaymentSettings(paymentSettings);
      if (res?.data?.settings) {
        setPaymentSettings(res.data.settings);
      }

      setCardStatus(prev => ({
        ...prev,
        [cardName]: { loading: false, error: null, success: true }
      }));
      toast.success('Settings saved successfully!');

      setTimeout(() => {
        setCardStatus(prev => ({
          ...prev,
          [cardName]: { ...prev[cardName], success: false }
        }));
      }, 3000);
    } catch (e) {
      const errMsg = e.message || e.response?.data?.message || 'Failed to save settings.';
      setCardStatus(prev => ({
        ...prev,
        [cardName]: { loading: false, error: errMsg, success: false }
      }));
      toast.error(errMsg);
    }
  };

  const handleClearCache = async () => {
    try {
      setClearingCache(true);
      const res = await adminService.clearCache();
      toast.success(`Cache cleared successfully! Cleared ${res.data?.clearedKeys || 0} keys.`);
      setShowClearCacheModal(false);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to clear cache.');
    } finally {
      setClearingCache(false);
    }
  };

  const fetchBackups = async () => {
    try {
      setLoadingBackups(true);
      const res = await adminService.getBackups();
      setBackups(res.data?.backups || []);
    } catch (e) {
      toast.error('Failed to load backup files.');
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setCreatingBackup(true);
      const res = await adminService.triggerBackup();
      toast.success('Database backup created successfully!');
      fetchBackups();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Database backup failed.');
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleDownloadBackup = async (fileName) => {
    try {
      toast.info(`Downloading backup: ${fileName}...`);
      await adminService.downloadBackup(fileName);
      toast.success('Backup file downloaded.');
    } catch (e) {
      toast.error('Backup download failed.');
    }
  };

  const handleCheckHealth = async () => {
    try {
      setShowHealthModal(true);
      setLoadingHealth(true);
      const res = await adminService.getHealth();
      setHealthData(res.data?.diagnostics || []);
    } catch (e) {
      toast.error('System diagnostics failed.');
    } finally {
      setLoadingHealth(false);
    }
  };

  // Comprehensive settings state to match all inputs in the screenshot
  const [settings, setSettings] = useState({
    platformName: 'Cravo',
    supportEmail: 'support@cravo.com',
    supportPhone: '+91 98765 43210',
    primaryColor: '#7C3AED',
    companyAddress: '123, Market Street, Bangalore, Karnataka 560001',
    websiteUrl: 'https://cravo.com',
    emailNotifications: true,
    companyName: 'Cravo Technologies Pvt. Ltd.',
    gstin: '29ABCDE1234F1Z5',
    taxRate: '18',
    maintenanceMode: false,
    allowRegistrations: true,
    allowSellerApplications: true,
    defaultLanguage: 'English',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD-MM-YYYY',
    timeFormat: '12 Hour',
    fromEmail: 'no-reply@cravo.com',
    fromName: 'Cravo Support',
    smtpStatus: 'Connected',
  });

  // Keep track of which card is in "edit mode" (optional UX enhancement)
  const [editingCard, setEditingCard] = useState({
    platform: false,
    branding: false,
    contact: false,
    business: false,
    system: false,
    time: false,
    email: false
  });

  useEffect(() => {
    if (activeTab === 'general') {
      fetchSettings();
    } else if (activeTab === 'orders') {
      fetchOrderSettings();
    } else if (activeTab === 'delivery') {
      fetchDeliverySettings();
      fetchDeliveryAnalytics();
      fetchDelhiveryInfo();
    } else if (activeTab === 'security') {
      fetchGovernanceSettings();
      fetchMarketplaceHealth();
    } else if (activeTab === 'payments') {
      fetchPaymentSettings();
      fetchPaymentHealth();
    } else if (activeTab === 'inventory') {
      fetchInventorySettings();
      fetchInventoryHealth();
    }
  }, [activeTab]);

  const fetchInventorySettings = async () => {
    try {
      setLoadingInventorySettings(true);
      const res = await adminService.getInventorySettings();
      if (res?.data?.settings) {
        setInventorySettings(res.data.settings);
      }
    } catch (e) {
      toast.error('Failed to load inventory settings');
    } finally {
      setLoadingInventorySettings(false);
    }
  };

  const fetchInventoryHealth = async () => {
    try {
      setLoadingInventoryHealth(true);
      const res = await adminService.getInventoryHealth();
      if (res?.data?.health) {
        setInventoryHealth(res.data.health);
      }
    } catch (e) {
      toast.error('Failed to load inventory health');
    } finally {
      setLoadingInventoryHealth(false);
    }
  };

  const handleSaveInventoryCard = async (cardName) => {
    if (!isSuperAdmin) {
      toast.error('Only the Super Admin is authorized to modify settings.');
      return;
    }

    try {
      setCardStatus(prev => ({
        ...prev,
        [cardName]: { ...prev[cardName], loading: true, error: null, success: false }
      }));

      // Validations
      if (cardName === 'lowStockRules') {
        const lowThresh = Number(inventorySettings.defaultLowStockThreshold);
        const critThresh = Number(inventorySettings.criticalStockThreshold);
        if (isNaN(lowThresh) || lowThresh < 1 || lowThresh > 1000) {
          throw new Error('Default Low Stock Threshold must be between 1 and 1000.');
        }
        if (isNaN(critThresh) || critThresh < 0) {
          throw new Error('Critical Stock Threshold must be a non-negative number.');
        }
        if (critThresh >= lowThresh) {
          throw new Error('Critical Stock Threshold must be lower than low stock threshold.');
        }
      }

      if (cardName === 'stockReservation') {
        const exp = Number(inventorySettings.reservationExpiryTime);
        if (isNaN(exp) || exp < 1 || exp > 1440) {
          throw new Error('Reservation Expiry Time must be between 1 and 1440 minutes.');
        }
      }

      if (cardName === 'inventoryLogs') {
        const ret = Number(inventorySettings.logRetentionPeriod);
        if (isNaN(ret) || ret <= 0) {
          throw new Error('Log Retention Period must be a positive number.');
        }
      }

      const res = await adminService.updateInventorySettings(inventorySettings);
      if (res?.data?.settings) {
        setInventorySettings(res.data.settings);
      }

      setCardStatus(prev => ({
        ...prev,
        [cardName]: { loading: false, error: null, success: true }
      }));
      toast.success('Settings saved successfully!');

      setTimeout(() => {
        setCardStatus(prev => ({
          ...prev,
          [cardName]: { ...prev[cardName], success: false }
        }));
      }, 3000);
    } catch (e) {
      const errMsg = e.message || e.response?.data?.message || 'Failed to save settings.';
      setCardStatus(prev => ({
        ...prev,
        [cardName]: { loading: false, error: errMsg, success: false }
      }));
      toast.error(errMsg);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await adminService.getSettings();
      if (data.data?.settings) {
        setSettings(prev => ({
          ...prev,
          platformName: data.data.settings.platformName || prev.platformName,
          supportEmail: data.data.settings.supportEmail || prev.supportEmail,
          smtpStatus: data.data.settings.smtpConnected ? 'Connected' : 'Disconnected'
        }));
      }
    } catch (error) {
      toast.error('Failed to load platform settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      await adminService.updateSettings({
        platformName: settings.platformName,
        supportEmail: settings.supportEmail
      });
      toast.success('All settings saved successfully');
      // Reset editing states
      setEditingCard({
        platform: false,
        branding: false,
        contact: false,
        business: false,
        system: false,
        time: false,
        email: false
      });
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleEdit = (card) => {
    setEditingCard(prev => ({ ...prev, [card]: !prev[card] }));
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Navigation tabs definition
  const tabs = [
    { id: 'general', label: 'General', icon: <Settings size={16} /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingCart size={16} /> },
    { id: 'payments', label: 'Payments', icon: <CreditCard size={16} /> },
    { id: 'delivery', label: 'Delivery', icon: <Truck size={16} /> },
    { id: 'inventory', label: 'Inventory', icon: <Database size={16} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
    { id: 'security', label: 'Security', icon: <Shield size={16} /> },
    { id: 'integrations', label: 'Integrations', icon: <Link2 size={16} /> },
    { id: 'feature-flags', label: 'Feature Flags', icon: <Flag size={16} /> },
    { id: 'maintenance', label: 'Maintenance', icon: <Wrench size={16} /> },
  ];

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Title & Header Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Platform Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage and configure your marketplace</p>
      </div>

      {/* Tabs list with horizontal scroll if needed */}
      <div className="border-b border-gray-200 overflow-x-auto scrollbar-none">
        <nav className="flex space-x-8 min-w-max pb-0.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-all motion-reduce:transition-none ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content Grid */}
      {activeTab === 'general' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Card 1: Platform Information Tile */}
            <button 
              id="tile-platform"
              onClick={() => setActiveModal('platform')}
              className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 text-left hover:scale-[1.02] hover:shadow-md active:scale-[0.98] transition-all duration-200 motion-reduce:transition-none motion-reduce:transform-none cursor-pointer flex flex-col justify-between min-h-[160px]"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <Info size={18} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm">Platform Information</h3>
                </div>
                <p className="text-xs text-gray-400">Configure name, support email address, and customer helpline phone number.</p>
              </div>
              <div className="text-[11px] font-semibold text-indigo-650 flex items-center gap-1 mt-2">
                <span>{settings.platformName || 'Configure'}</span>
                <span className="text-gray-300">•</span>
                <span className="truncate max-w-[150px]">{settings.supportEmail || 'Configure'}</span>
              </div>
            </button>

            {/* Card 2: Contact & Address Tile */}
            <button 
              id="tile-contact"
              onClick={() => setActiveModal('contact')}
              className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 text-left hover:scale-[1.02] hover:shadow-md active:scale-[0.98] transition-all duration-200 motion-reduce:transition-none motion-reduce:transform-none cursor-pointer flex flex-col justify-between min-h-[160px]"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                    <MapPin size={18} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm">Contact & Address</h3>
                </div>
                <p className="text-xs text-gray-400">Define office location, official store website URL, and email alert rules.</p>
              </div>
              <div className="text-[11px] font-semibold text-indigo-650 flex items-center gap-1 mt-2">
                <span className="truncate max-w-[150px]">{settings.websiteUrl || 'Configure'}</span>
                <span className="text-gray-300">•</span>
                <span>{settings.emailNotifications ? 'Alerts Enabled' : 'Alerts Disabled'}</span>
              </div>
            </button>

            {/* Card 3: Business Details Tile */}
            <button 
              id="tile-business"
              onClick={() => setActiveModal('business')}
              className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 text-left hover:scale-[1.02] hover:shadow-md active:scale-[0.98] transition-all duration-200 motion-reduce:transition-none motion-reduce:transform-none cursor-pointer flex flex-col justify-between min-h-[160px]"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                    <Briefcase size={18} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm">Business Details</h3>
                </div>
                <p className="text-xs text-gray-400">Manage tax information, business entity name, and local GSTIN details.</p>
              </div>
              <div className="text-[11px] font-semibold text-indigo-650 flex items-center gap-1 mt-2">
                <span className="truncate max-w-[150px]">{settings.companyName || 'Configure'}</span>
                <span className="text-gray-300">•</span>
                <span>Tax: {settings.taxRate}%</span>
              </div>
            </button>

            {/* Card 4: System Preferences Tile */}
            <button 
              id="tile-system"
              onClick={() => setActiveModal('system')}
              className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 text-left hover:scale-[1.02] hover:shadow-md active:scale-[0.98] transition-all duration-200 motion-reduce:transition-none motion-reduce:transform-none cursor-pointer flex flex-col justify-between min-h-[160px]"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600">
                    <Sliders size={18} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm">System Preferences</h3>
                </div>
                <p className="text-xs text-gray-400">Tweak registrations settings, default languages, and marketplace visibility toggles.</p>
              </div>
              <div className="text-[11px] font-semibold text-indigo-650 flex items-center gap-1 mt-2">
                <span>{settings.maintenanceMode ? 'Maintenance ON' : 'Marketplace Active'}</span>
                <span className="text-gray-300">•</span>
                <span>{settings.defaultLanguage}</span>
              </div>
            </button>

            {/* Card 5: Email Settings Tile */}
            <button 
              id="tile-email"
              onClick={() => setActiveModal('email')}
              className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 text-left hover:scale-[1.02] hover:shadow-md active:scale-[0.98] transition-all duration-200 motion-reduce:transition-none motion-reduce:transform-none cursor-pointer flex flex-col justify-between min-h-[160px]"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
                    <Mail size={18} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm">Email Settings</h3>
                </div>
                <p className="text-xs text-gray-400">SMTP mail server sender addresses, friendly system names, and connectivity.</p>
              </div>
              <div className="text-[11px] font-semibold text-indigo-650 flex items-center gap-1 mt-2">
                <span>SMTP: {settings.smtpStatus}</span>
                <span className="text-gray-300">•</span>
                <span className="truncate max-w-[150px]">{settings.fromEmail}</span>
              </div>
            </button>

            {/* Card 6: Quick Actions Tile */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col justify-between min-h-[160px]">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600">
                    <Zap size={18} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm">Quick Actions</h3>
                </div>
                <p className="text-xs text-gray-400">Trigger immediate application operations like backups, cache flush, or audit logs.</p>
              </div>
              <div className="flex gap-2 mt-2">
                <button 
                  onClick={() => setShowClearCacheModal(true)}
                  className="px-2.5 py-1 bg-violet-50 hover:bg-violet-100 text-violet-750 font-bold rounded-lg text-[10px] cursor-pointer"
                >
                  Clear Cache
                </button>
                <button 
                  onClick={() => { setShowBackupModal(true); fetchBackups(); }}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-750 font-bold rounded-lg text-[10px] cursor-pointer"
                >
                  Backup DB
                </button>
                <button 
                  onClick={handleCheckHealth}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-750 font-bold rounded-lg text-[10px] cursor-pointer"
                >
                  Diagnostics
                </button>
                <button 
                  onClick={() => navigate('/admin/audit-logs')}
                  className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-750 font-bold rounded-lg text-[10px] cursor-pointer"
                >
                  Logs
                </button>
              </div>
            </div>

          </div>

          {/* Bottom Bar / Last Updated Footer */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white border border-gray-100 p-4 rounded-2xl shadow-sm mt-6">
            <div className="flex items-center gap-3 text-gray-500">
              <Calendar size={18} className="text-indigo-600 shrink-0" />
              <span className="text-xs font-medium">
                Last Updated: Updated by <span className="font-bold text-gray-700">shabanahaneef10@gmail.com</span> on 12 May 2025, 10:30 AM
              </span>
            </div>
            
            <button 
              onClick={handleSaveAll}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all motion-reduce:transition-none disabled:opacity-50 text-xs shadow-sm shadow-indigo-600/10 cursor-pointer"
            >
              <Check size={16} />
              {saving ? 'Saving Changes...' : 'Save All Changes'}
            </button>
          </div>
        </div>
      ) : activeTab === 'orders' ? (
        loadingOrderSettings ? (
          <div className="flex items-center justify-center h-64 bg-white border border-gray-100 rounded-2xl shadow-sm">
            <div className="motion-safe:animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-indigo-50/40 border border-indigo-100/30 p-4 rounded-2xl">
              <div className="flex items-start gap-3 text-indigo-950">
                <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">Super Admin Configurable Panels</h4>
                  <p className="text-xs text-indigo-700 mt-1">These settings modify checkout processing and status rules instantly. All modifications are logged.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Card 1: Order Lifecycle Tile */}
              <button 
                id="tile-lifecycle"
                onClick={() => setActiveModal('lifecycle')}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 text-left hover:scale-[1.02] hover:shadow-md active:scale-[0.98] transition-all duration-200 motion-reduce:transition-none motion-reduce:transform-none cursor-pointer flex flex-col justify-between min-h-[160px]"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Clock size={18} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">Order Lifecycle</h3>
                  </div>
                  <p className="text-xs text-gray-400">Configure unconfirmed timeouts, auto-completion, and cancellation windows.</p>
                </div>
                <div className="text-[11px] font-semibold text-indigo-650 flex items-center gap-1 mt-2">
                  <span>Cancel: {orderSettings.autoCancelUnconfirmedMins}m</span>
                  <span className="text-gray-300">•</span>
                  <span>Complete: {orderSettings.autoCompleteDeliveredDays}d</span>
                  <span className="text-gray-300">•</span>
                  <span>Cancel Window: {orderSettings.customerCancellationWindowMins}m</span>
                </div>
              </button>

              {/* Card 2: Order Limits Tile */}
              <button 
                id="tile-limits"
                onClick={() => setActiveModal('limits')}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 text-left hover:scale-[1.02] hover:shadow-md active:scale-[0.98] transition-all duration-200 motion-reduce:transition-none motion-reduce:transform-none cursor-pointer flex flex-col justify-between min-h-[160px]"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600">
                      <Sliders size={18} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">Order Limits</h3>
                  </div>
                  <p className="text-xs text-gray-400">Enforce minimum/maximum order totals, maximum items, and quantities per product.</p>
                </div>
                <div className="text-[11px] font-semibold text-indigo-650 flex items-center gap-1 mt-2">
                  <span>Value: ₹{orderSettings.minOrderValue} - ₹{orderSettings.maxOrderValue}</span>
                  <span className="text-gray-300">•</span>
                  <span>Max Items: {orderSettings.maxItemsPerOrder}</span>
                </div>
              </button>

              {/* Card 3: Order Protection Rules Tile */}
              <button 
                id="tile-protection"
                onClick={() => setActiveModal('protection')}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 text-left hover:scale-[1.02] hover:shadow-md active:scale-[0.98] transition-all duration-200 motion-reduce:transition-none motion-reduce:transform-none cursor-pointer flex flex-col justify-between min-h-[160px]"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <Shield size={18} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">Protection Rules</h3>
                  </div>
                  <p className="text-xs text-gray-400">Validate user roles, verification flags, and delivery address active states.</p>
                </div>
                <div className="text-[11px] font-semibold text-indigo-650 flex items-center gap-1 mt-2">
                  <span>Email: {orderSettings.requireVerifiedEmail ? 'Required' : 'Optional'}</span>
                  <span className="text-gray-300">•</span>
                  <span>Guest: {orderSettings.allowGuestOrders ? 'Allowed' : 'Blocked'}</span>
                </div>
              </button>

              {/* Card 4: Seller Order Rules Tile */}
              <button 
                id="tile-seller"
                onClick={() => setActiveModal('seller')}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 text-left hover:scale-[1.02] hover:shadow-md active:scale-[0.98] transition-all duration-200 motion-reduce:transition-none motion-reduce:transform-none cursor-pointer flex flex-col justify-between min-h-[160px]"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                      <Store size={18} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">Seller Order Rules</h3>
                  </div>
                  <p className="text-xs text-gray-400">Configure timeouts and actions for unacknowledged orders by shop vendors.</p>
                </div>
                <div className="text-[11px] font-semibold text-indigo-650 flex items-center gap-1 mt-2">
                  <span>Expire: {orderSettings.autoExpireSellerAcceptanceMins}m</span>
                  <span className="text-gray-300">•</span>
                  <span>Action: {orderSettings.sellerAcceptanceAction}</span>
                </div>
              </button>

              {/* Card 5: Refund Settings Tile */}
              <button 
                id="tile-refund"
                onClick={() => setActiveModal('refund')}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 text-left hover:scale-[1.02] hover:shadow-md active:scale-[0.98] transition-all duration-200 motion-reduce:transition-none motion-reduce:transform-none cursor-pointer flex flex-col justify-between min-h-[160px]"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                      <CreditCard size={18} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">Refund Settings</h3>
                  </div>
                  <p className="text-xs text-gray-400">Manage refund requests capabilities, request windows, and approval rules.</p>
                </div>
                <div className="text-[11px] font-semibold text-indigo-650 flex items-center gap-1 mt-2">
                  <span>Refunds: {orderSettings.allowRefundRequests ? 'Allowed' : 'Disabled'}</span>
                  <span className="text-gray-300">•</span>
                  <span>Window: {orderSettings.refundRequestWindowDays}d</span>
                </div>
              </button>

              {/* Card 6: Order Status Control Tile */}
              <button 
                id="tile-transitions"
                onClick={() => setActiveModal('transitions')}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 text-left hover:scale-[1.02] hover:shadow-md active:scale-[0.98] transition-all duration-200 motion-reduce:transition-none motion-reduce:transform-none cursor-pointer flex flex-col justify-between min-h-[160px]"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                      <Wrench size={18} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">Order Status Control</h3>
                  </div>
                  <p className="text-xs text-gray-400">Define which status updates are permitted in the order lifecycle pipeline.</p>
                </div>
                <div className="text-[11px] font-semibold text-indigo-650 flex items-center gap-1 mt-2">
                  <span>Configure valid destination pathways</span>
                </div>
              </button>

            </div>
          </div>
        )
      ) : activeTab === 'delivery' ? (
        loadingDeliverySettings ? (
          <div className="flex items-center justify-center h-64 bg-white border border-gray-100 rounded-2xl shadow-sm">
            <div className="motion-safe:animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Delivery Alert Header */}
            <div className="flex justify-between items-center bg-indigo-50/40 border border-indigo-100/30 p-4 rounded-2xl">
              <div className="flex items-start gap-3 text-indigo-950">
                <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">Super Admin Delivery Control Panel</h4>
                  <p className="text-xs text-indigo-700 mt-1">Manage delivery options, coverage rules, shipping rates, and third-party integrations.</p>
                </div>
              </div>
            </div>

            {/* Grid for settings cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* CARD 1: Delivery Modes */}
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col justify-between min-h-[200px]">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Truck size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Delivery Modes</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Toggle delivery, customer pickup, or scheduled deliveries.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700 font-medium">Enable Delivery Orders</span>
                      <button
                        onClick={() => setDeliverySettings(prev => ({ ...prev, enableDeliveryOrders: !prev.enableDeliveryOrders }))}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ${deliverySettings.enableDeliveryOrders ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${deliverySettings.enableDeliveryOrders ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700 font-medium">Enable Pickup Orders</span>
                      <button
                        onClick={() => setDeliverySettings(prev => ({ ...prev, enablePickupOrders: !prev.enablePickupOrders }))}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ${deliverySettings.enablePickupOrders ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${deliverySettings.enablePickupOrders ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700 font-medium">Enable Scheduled Deliveries</span>
                      <button
                        onClick={() => setDeliverySettings(prev => ({ ...prev, enableScheduledDeliveries: !prev.enableScheduledDeliveries }))}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ${deliverySettings.enableScheduledDeliveries ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${deliverySettings.enableScheduledDeliveries ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-500">
                    {cardStatus.deliveryModes.success && <span className="text-green-600">Saved</span>}
                    {cardStatus.deliveryModes.error && <span className="text-red-650">{cardStatus.deliveryModes.error}</span>}
                  </span>
                  <button
                    onClick={() => handleSaveDeliveryCard('deliveryModes')}
                    disabled={cardStatus.deliveryModes.loading || !isSuperAdmin}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs cursor-pointer"
                  >
                    {cardStatus.deliveryModes.loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>

              {/* CARD 2: Delivery Coverage */}
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col justify-between min-h-[200px]">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Delivery Coverage</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Restrict delivery region policies.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Current Marketplace Coverage</span>
                      <span className="text-xs font-bold text-gray-700 bg-gray-50 px-2 py-0.5 rounded">Kerala (All Districts)</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700 font-medium">Restrict Outside Kerala</span>
                      <button
                        onClick={() => setDeliverySettings(prev => ({ ...prev, restrictOutsideKerala: !prev.restrictOutsideKerala }))}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ${deliverySettings.restrictOutsideKerala ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${deliverySettings.restrictOutsideKerala ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700 font-medium">Allow Future State Expansion</span>
                      <button
                        onClick={() => setDeliverySettings(prev => ({ ...prev, allowFutureStateExpansion: !prev.allowFutureStateExpansion }))}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ${deliverySettings.allowFutureStateExpansion ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${deliverySettings.allowFutureStateExpansion ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-500">
                    {cardStatus.deliveryCoverage.success && <span className="text-green-600">Saved</span>}
                    {cardStatus.deliveryCoverage.error && <span className="text-red-650">{cardStatus.deliveryCoverage.error}</span>}
                  </span>
                  <button
                    onClick={() => handleSaveDeliveryCard('deliveryCoverage')}
                    disabled={cardStatus.deliveryCoverage.loading || !isSuperAdmin}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs cursor-pointer"
                  >
                    {cardStatus.deliveryCoverage.loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>

              {/* CARD 3: Delivery Charges */}
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col justify-between min-h-[200px]">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <CreditCard size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Delivery Charges</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Setup fee rules, thresholds, and overrides.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700 font-medium">Enable Delivery Charges</span>
                      <button
                        onClick={() => setDeliverySettings(prev => ({ ...prev, enableDeliveryCharges: !prev.enableDeliveryCharges }))}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ${deliverySettings.enableDeliveryCharges ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${deliverySettings.enableDeliveryCharges ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Default Charge (₹)</label>
                        <input
                          type="number"
                          value={deliverySettings.defaultDeliveryCharge}
                          onChange={(e) => setDeliverySettings(prev => ({ ...prev, defaultDeliveryCharge: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-medium focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Free Threshold (₹)</label>
                        <input
                          type="number"
                          value={deliverySettings.freeDeliveryThreshold}
                          onChange={(e) => setDeliverySettings(prev => ({ ...prev, freeDeliveryThreshold: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-medium focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-gray-700 font-medium">Allow Promotional Free Delivery</span>
                      <button
                        onClick={() => setDeliverySettings(prev => ({ ...prev, allowPromotionalFreeDelivery: !prev.allowPromotionalFreeDelivery }))}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ${deliverySettings.allowPromotionalFreeDelivery ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${deliverySettings.allowPromotionalFreeDelivery ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-500">
                    {cardStatus.deliveryCharges.success && <span className="text-green-600">Saved</span>}
                    {cardStatus.deliveryCharges.error && <span className="text-red-650">{cardStatus.deliveryCharges.error}</span>}
                  </span>
                  <button
                    onClick={() => handleSaveDeliveryCard('deliveryCharges')}
                    disabled={cardStatus.deliveryCharges.loading || !isSuperAdmin}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs cursor-pointer"
                  >
                    {cardStatus.deliveryCharges.loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>

              {/* CARD 4: Delivery Estimation */}
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col justify-between min-h-[200px]">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
                      <Clock size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Delivery Estimates</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Customize time estimates shown to customers.</p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Expected Dispatch</label>
                        <input
                          type="text"
                          value={deliverySettings.expectedDispatchTime}
                          onChange={(e) => setDeliverySettings(prev => ({ ...prev, expectedDispatchTime: e.target.value }))}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Standard Delivery</label>
                        <input
                          type="text"
                          value={deliverySettings.standardDeliveryTime}
                          onChange={(e) => setDeliverySettings(prev => ({ ...prev, standardDeliveryTime: e.target.value }))}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Remote Area</label>
                        <input
                          type="text"
                          value={deliverySettings.remoteAreaDeliveryTime}
                          onChange={(e) => setDeliverySettings(prev => ({ ...prev, remoteAreaDeliveryTime: e.target.value }))}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-gray-700 font-medium">Display Estimates to Customers</span>
                      <button
                        onClick={() => setDeliverySettings(prev => ({ ...prev, displayEstimatesToCustomers: !prev.displayEstimatesToCustomers }))}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ${deliverySettings.displayEstimatesToCustomers ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${deliverySettings.displayEstimatesToCustomers ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-500">
                    {cardStatus.deliveryEstimates.success && <span className="text-green-600">Saved</span>}
                    {cardStatus.deliveryEstimates.error && <span className="text-red-650">{cardStatus.deliveryEstimates.error}</span>}
                  </span>
                  <button
                    onClick={() => handleSaveDeliveryCard('deliveryEstimates')}
                    disabled={cardStatus.deliveryEstimates.loading || !isSuperAdmin}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs cursor-pointer"
                  >
                    {cardStatus.deliveryEstimates.loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>

              {/* CARD 5: Order Fulfillment Rules */}
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col justify-between min-h-[200px]">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                      <Sliders size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Fulfillment Rules</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Manage seller prepare times and auto-cancellations.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Default Seller Prep</label>
                        <input
                          type="text"
                          value={deliverySettings.defaultSellerPrepTime}
                          onChange={(e) => setDeliverySettings(prev => ({ ...prev, defaultSellerPrepTime: e.target.value }))}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Max Seller Prep</label>
                        <input
                          type="text"
                          value={deliverySettings.maxSellerPrepTime}
                          onChange={(e) => setDeliverySettings(prev => ({ ...prev, maxSellerPrepTime: e.target.value }))}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700 font-medium">Auto Cancel Unfulfilled</span>
                      <button
                        onClick={() => setDeliverySettings(prev => ({ ...prev, autoCancelUnfulfilledOrders: !prev.autoCancelUnfulfilledOrders }))}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ${deliverySettings.autoCancelUnfulfilledOrders ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${deliverySettings.autoCancelUnfulfilledOrders ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    {deliverySettings.autoCancelUnfulfilledOrders && (
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Auto Cancel Window (Days)</label>
                        <input
                          type="number"
                          value={deliverySettings.autoCancelWindowDays}
                          onChange={(e) => setDeliverySettings(prev => ({ ...prev, autoCancelWindowDays: parseInt(e.target.value) || 0 }))}
                          className="w-20 px-2 py-1 border border-gray-200 rounded text-xs focus:border-indigo-500 outline-none text-right"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-500">
                    {cardStatus.fulfillmentRules.success && <span className="text-green-600">Saved</span>}
                    {cardStatus.fulfillmentRules.error && <span className="text-red-650">{cardStatus.fulfillmentRules.error}</span>}
                  </span>
                  <button
                    onClick={() => handleSaveDeliveryCard('fulfillmentRules')}
                    disabled={cardStatus.fulfillmentRules.loading || !isSuperAdmin}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs cursor-pointer"
                  >
                    {cardStatus.fulfillmentRules.loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>

              {/* CARD 6: Delhivery Integration */}
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col justify-between min-h-[200px]">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-pink-650">
                      <Zap size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Delhivery Integration</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Read-only API diagnostics & connections.</p>
                    </div>
                  </div>

                  {loadingDelhiveryInfo ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 size={16} className="animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Connection Status</span>
                        <span className={`font-bold ${delhiveryInfo.connectionStatus === 'HEALTHY' ? 'text-green-600' : 'text-red-650'}`}>{delhiveryInfo.connectionStatus}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Shipment API</span>
                        <span className="font-semibold text-gray-700">{delhiveryInfo.shipmentApiStatus}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tracking API</span>
                        <span className="font-semibold text-gray-700">{delhiveryInfo.trackingApiStatus}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Last successful shipment</span>
                        <span className="font-semibold text-gray-700 truncate max-w-[120px]">{delhiveryInfo.lastSuccessfulShipment ? new Date(delhiveryInfo.lastSuccessfulShipment).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Last successful sync</span>
                        <span className="font-semibold text-gray-700 truncate max-w-[120px]">{delhiveryInfo.lastSuccessfulTrackingSync ? new Date(delhiveryInfo.lastSuccessfulTrackingSync).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Response time</span>
                        <span className="font-semibold text-gray-700">{delhiveryInfo.averageResponseTime}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end items-center mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={handleTestDelhiveryConnection}
                    disabled={testingConnection || !isSuperAdmin}
                    className="px-3 py-1.5 bg-violet-50 hover:bg-violet-100 disabled:opacity-50 text-violet-750 font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {testingConnection && <Loader2 size={12} className="animate-spin" />}
                    {testingConnection ? 'Testing...' : 'Test Connection'}
                  </button>
                </div>
              </div>

              {/* CARD 7: Shipment Automation */}
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col justify-between min-h-[200px]">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                      <RotateCw size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Shipment Automation</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Automate booking and waybill synchronization.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700 font-medium">Auto Create Shipment</span>
                      <button
                        onClick={() => setDeliverySettings(prev => ({ ...prev, autoCreateShipment: !prev.autoCreateShipment }))}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ${deliverySettings.autoCreateShipment ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${deliverySettings.autoCreateShipment ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700 font-medium">Auto Sync Tracking</span>
                      <button
                        onClick={() => setDeliverySettings(prev => ({ ...prev, autoSyncTracking: !prev.autoSyncTracking }))}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ${deliverySettings.autoSyncTracking ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${deliverySettings.autoSyncTracking ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sync Interval (Mins)</label>
                      <input
                        type="number"
                        value={deliverySettings.trackingSyncIntervalMins}
                        onChange={(e) => setDeliverySettings(prev => ({ ...prev, trackingSyncIntervalMins: parseInt(e.target.value) || 0 }))}
                        className="w-20 px-2 py-1 border border-gray-200 rounded text-xs focus:border-indigo-500 outline-none text-right"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-500">
                    {cardStatus.shipmentAutomation.success && <span className="text-green-600">Saved</span>}
                    {cardStatus.shipmentAutomation.error && <span className="text-red-650">{cardStatus.shipmentAutomation.error}</span>}
                  </span>
                  <button
                    onClick={() => handleSaveDeliveryCard('shipmentAutomation')}
                    disabled={cardStatus.shipmentAutomation.loading || !isSuperAdmin}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs cursor-pointer"
                  >
                    {cardStatus.shipmentAutomation.loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>

              {/* CARD 8: Pickup Settings */}
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col justify-between min-h-[200px]">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                      <Store size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Pickup Settings</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Define verification rules and window parameters.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700 font-medium">Enable Pickup Verification</span>
                      <button
                        onClick={() => setDeliverySettings(prev => ({ ...prev, enablePickupVerification: !prev.enablePickupVerification }))}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ${deliverySettings.enablePickupVerification ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${deliverySettings.enablePickupVerification ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700 font-medium">Require Pickup OTP</span>
                      <button
                        onClick={() => setDeliverySettings(prev => ({ ...prev, requirePickupOtp: !prev.requirePickupOtp }))}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ${deliverySettings.requirePickupOtp ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${deliverySettings.requirePickupOtp ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Expiry Window (Hours)</label>
                      <input
                        type="number"
                        value={deliverySettings.pickupExpiryWindowHours}
                        onChange={(e) => setDeliverySettings(prev => ({ ...prev, pickupExpiryWindowHours: parseInt(e.target.value) || 0 }))}
                        className="w-20 px-2 py-1 border border-gray-200 rounded text-xs focus:border-indigo-500 outline-none text-right"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-500">
                    {cardStatus.pickupSettings.success && <span className="text-green-600">Saved</span>}
                    {cardStatus.pickupSettings.error && <span className="text-red-650">{cardStatus.pickupSettings.error}</span>}
                  </span>
                  <button
                    onClick={() => handleSaveDeliveryCard('pickupSettings')}
                    disabled={cardStatus.pickupSettings.loading || !isSuperAdmin}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs cursor-pointer"
                  >
                    {cardStatus.pickupSettings.loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>

              {/* CARD 9: Customer Rules */}
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col justify-between min-h-[200px]">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <Shield size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Customer Rules</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Enforce verification, default addresses, and edit windows.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700 font-medium">Require Verified Address</span>
                      <button
                        onClick={() => setDeliverySettings(prev => ({ ...prev, requireVerifiedAddress: !prev.requireVerifiedAddress }))}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ${deliverySettings.requireVerifiedAddress ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${deliverySettings.requireVerifiedAddress ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700 font-medium">Require Default Address</span>
                      <button
                        onClick={() => setDeliverySettings(prev => ({ ...prev, requireDefaultAddress: !prev.requireDefaultAddress }))}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ${deliverySettings.requireDefaultAddress ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${deliverySettings.requireDefaultAddress ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700 font-medium">Allow Address Changes</span>
                      <button
                        onClick={() => setDeliverySettings(prev => ({ ...prev, allowAddressChanges: !prev.allowAddressChanges }))}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ${deliverySettings.allowAddressChanges ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${deliverySettings.allowAddressChanges ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    {deliverySettings.allowAddressChanges && (
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mod. Window (Mins)</label>
                        <input
                          type="number"
                          value={deliverySettings.maxAddressModificationWindowMins}
                          onChange={(e) => setDeliverySettings(prev => ({ ...prev, maxAddressModificationWindowMins: parseInt(e.target.value) || 0 }))}
                          className="w-20 px-2 py-1 border border-gray-200 rounded text-xs focus:border-indigo-500 outline-none text-right"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-500">
                    {cardStatus.customerRules.success && <span className="text-green-600">Saved</span>}
                    {cardStatus.customerRules.error && <span className="text-red-650">{cardStatus.customerRules.error}</span>}
                  </span>
                  <button
                    onClick={() => handleSaveDeliveryCard('customerRules')}
                    disabled={cardStatus.customerRules.loading || !isSuperAdmin}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs cursor-pointer"
                  >
                    {cardStatus.customerRules.loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>

              {/* CARD 10: Delivery Analytics Dashboard */}
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col justify-between min-h-[200px]">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Activity size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Delivery Analytics</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Read-only performance dashboard.</p>
                    </div>
                  </div>

                  {loadingDeliveryAnalytics ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 size={16} className="motion-safe:animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total Deliveries</span>
                        <span className="font-bold text-gray-800">{deliveryAnalytics.totalDeliveries}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Successful Deliveries</span>
                        <span className="font-semibold text-green-600">{deliveryAnalytics.successfulDeliveries}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Failed Deliveries</span>
                        <span className="font-semibold text-red-650">{deliveryAnalytics.failedDeliveries}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Average Delivery Time</span>
                        <span className="font-semibold text-gray-700">{deliveryAnalytics.averageDeliveryTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Late Deliveries</span>
                        <span className="font-semibold text-amber-600">{deliveryAnalytics.lateDeliveries}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Active Shipments</span>
                        <span className="font-semibold text-indigo-655">{deliveryAnalytics.activeShipments}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-gray-50">
                        <span className="text-gray-650 font-bold">Delhivery Success Rate</span>
                        <span className="font-bold text-indigo-600">{deliveryAnalytics.delhiverySuccessRate}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={async () => {
                      await fetchDeliveryAnalytics();
                      toast.success('Analytics refreshed.');
                    }}
                    disabled={loadingDeliveryAnalytics}
                    className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-755 font-bold rounded-lg text-[10px] cursor-pointer"
                  >
                    Refresh
                  </button>
                </div>
              </div>

            </div>
          </div>
        )
      ) : activeTab === 'security' ? (
        loadingGovernanceSettings ? (
          <div className="flex items-center justify-center h-64 bg-white border border-gray-100 rounded-2xl shadow-sm">
            <div className="motion-safe:animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <section className="space-y-8" aria-label="Governance and Security Settings">
            <header className="flex justify-between items-center bg-indigo-50/40 border border-indigo-100/30 p-4 rounded-2xl">
              <div className="flex items-start gap-4 text-indigo-950">
                <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">Super Admin Governance & Security Control</h4>
                  <p className="text-xs text-indigo-700 mt-1">Configure marketplace compliance rules, seller/product restrictions, customer account policies, and inspect governance metrics. All changes are written to system audit logs.</p>
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

              {/* CARD 1: Seller Governance */}
              <article className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col justify-between min-h-[200px]">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Store size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Seller Governance</h3>
                      <p className="text-xs text-gray-400 mt-1">Enforce approvals, documents, and reapplication rules.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700 font-medium">Require Seller Approval</span>
                      <button
                        onClick={() => setGovernanceSettings(prev => ({ ...prev, requireSellerApproval: !prev.requireSellerApproval }))}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 motion-reduce:transition-none ${governanceSettings.requireSellerApproval ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 motion-reduce:transition-none ${governanceSettings.requireSellerApproval ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700 font-medium">Require Document Verification</span>
                      <button
                        onClick={() => setGovernanceSettings(prev => ({ ...prev, requireSellerDocumentVerification: !prev.requireSellerDocumentVerification }))}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 motion-reduce:transition-none ${governanceSettings.requireSellerDocumentVerification ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 motion-reduce:transition-none ${governanceSettings.requireSellerDocumentVerification ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700 font-medium">Allow Seller Reapplication</span>
                      <button
                        onClick={() => setGovernanceSettings(prev => ({ ...prev, allowSellerReapplication: !prev.allowSellerReapplication }))}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 motion-reduce:transition-none ${governanceSettings.allowSellerReapplication ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 motion-reduce:transition-none ${governanceSettings.allowSellerReapplication ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-500">
                    {cardStatus.sellerGovernance.success && <span className="text-green-600">Saved</span>}
                    {cardStatus.sellerGovernance.error && <span className="text-red-655">{cardStatus.sellerGovernance.error}</span>}
                  </span>
                  <button
                    onClick={() => handleSaveGovernanceCard('sellerGovernance')}
                    disabled={cardStatus.sellerGovernance.loading || !isSuperAdmin}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs cursor-pointer transition-colors motion-reduce:transition-none"
                  >
                    {cardStatus.sellerGovernance.loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </article>

              {/* CARD 2: Product Governance */}
              <article className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col justify-between min-h-[200px]">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600">
                      <Sliders size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Product Governance</h3>
                      <p className="text-xs text-gray-400 mt-1">Control submission approval rules and drafts status.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700 font-medium">Require Product Approval</span>
                      <button
                        onClick={() => setGovernanceSettings(prev => ({ ...prev, requireProductApproval: !prev.requireProductApproval }))}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 motion-reduce:transition-none ${governanceSettings.requireProductApproval ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 motion-reduce:transition-none ${governanceSettings.requireProductApproval ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700 font-medium">Reapprove After Product Update</span>
                      <button
                        onClick={() => setGovernanceSettings(prev => ({ ...prev, reapproveAfterProductUpdate: !prev.reapproveAfterProductUpdate }))}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 motion-reduce:transition-none ${governanceSettings.reapproveAfterProductUpdate ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 motion-reduce:transition-none ${governanceSettings.reapproveAfterProductUpdate ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700 font-medium">Allow Product Drafts</span>
                      <button
                        onClick={() => setGovernanceSettings(prev => ({ ...prev, allowProductDrafts: !prev.allowProductDrafts }))}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 motion-reduce:transition-none ${governanceSettings.allowProductDrafts ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 motion-reduce:transition-none ${governanceSettings.allowProductDrafts ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-500">
                    {cardStatus.productGovernance.success && <span className="text-green-600">Saved</span>}
                    {cardStatus.productGovernance.error && <span className="text-red-655">{cardStatus.productGovernance.error}</span>}
                  </span>
                  <button
                    onClick={() => handleSaveGovernanceCard('productGovernance')}
                    disabled={cardStatus.productGovernance.loading || !isSuperAdmin}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs cursor-pointer transition-colors motion-reduce:transition-none"
                  >
                    {cardStatus.productGovernance.loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </article>

              {/* CARD 3: Customer Rules Card */}
              <article className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col justify-between min-h-[200px]">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <Shield size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Customer Rules</h3>
                      <p className="text-xs text-gray-400 mt-1">Configure customer verification and suspend policies.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700 font-medium">Require Email Verification</span>
                      <button
                        onClick={() => setGovernanceSettings(prev => ({ ...prev, requireEmailVerification: !prev.requireEmailVerification }))}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 motion-reduce:transition-none ${governanceSettings.requireEmailVerification ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 motion-reduce:transition-none ${governanceSettings.requireEmailVerification ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700 font-medium">Block Suspended Users</span>
                      <button
                        onClick={() => setGovernanceSettings(prev => ({ ...prev, blockSuspendedUsers: !prev.blockSuspendedUsers }))}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 motion-reduce:transition-none ${governanceSettings.blockSuspendedUsers ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 motion-reduce:transition-none ${governanceSettings.blockSuspendedUsers ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-500">
                    {cardStatus.customerRulesCard.success && <span className="text-green-600">Saved</span>}
                    {cardStatus.customerRulesCard.error && <span className="text-red-655">{cardStatus.customerRulesCard.error}</span>}
                  </span>
                  <button
                    onClick={() => handleSaveGovernanceCard('customerRulesCard')}
                    disabled={cardStatus.customerRulesCard.loading || !isSuperAdmin}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs cursor-pointer transition-colors motion-reduce:transition-none"
                  >
                    {cardStatus.customerRulesCard.loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </article>

              {/* CARD 4: Marketplace Access Card */}
              <article className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col justify-between min-h-[200px]">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
                      <Globe size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Marketplace Access</h3>
                      <p className="text-xs text-gray-400 mt-1">Global submission/registration gates toggle.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700 font-medium">Allow New Customer Registrations</span>
                      <button
                        onClick={() => setGovernanceSettings(prev => ({ ...prev, allowNewCustomerRegistrations: !prev.allowNewCustomerRegistrations }))}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 motion-reduce:transition-none ${governanceSettings.allowNewCustomerRegistrations ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 motion-reduce:transition-none ${governanceSettings.allowNewCustomerRegistrations ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700 font-medium">Allow New Seller Applications</span>
                      <button
                        onClick={() => setGovernanceSettings(prev => ({ ...prev, allowNewSellerApplications: !prev.allowNewSellerApplications }))}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 motion-reduce:transition-none ${governanceSettings.allowNewSellerApplications ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 motion-reduce:transition-none ${governanceSettings.allowNewSellerApplications ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700 font-medium">Allow New Product Submissions</span>
                      <button
                        onClick={() => setGovernanceSettings(prev => ({ ...prev, allowNewProductSubmissions: !prev.allowNewProductSubmissions }))}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 motion-reduce:transition-none ${governanceSettings.allowNewProductSubmissions ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 motion-reduce:transition-none ${governanceSettings.allowNewProductSubmissions ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-500">
                    {cardStatus.marketplaceAccess.success && <span className="text-green-600">Saved</span>}
                    {cardStatus.marketplaceAccess.error && <span className="text-red-655">{cardStatus.marketplaceAccess.error}</span>}
                  </span>
                  <button
                    onClick={() => handleSaveGovernanceCard('marketplaceAccess')}
                    disabled={cardStatus.marketplaceAccess.loading || !isSuperAdmin}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs cursor-pointer transition-colors motion-reduce:transition-none"
                  >
                    {cardStatus.marketplaceAccess.loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </article>

              {/* CARD 5: Marketplace Health Card */}
              <article className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col justify-between min-h-[200px]">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Activity size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Marketplace Health</h3>
                      <p className="text-xs text-gray-400 mt-1">Read-only real-time ecosystem diagnostics.</p>
                    </div>
                  </div>

                  {loadingMarketplaceHealth ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 size={16} className="motion-safe:animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Total Customers</span>
                        <span className="font-bold text-gray-800">{marketplaceHealth.totalCustomers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Total Sellers</span>
                        <span className="font-bold text-gray-800">{marketplaceHealth.totalSellers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Active Sellers</span>
                        <span className="font-semibold text-green-600">{marketplaceHealth.activeSellers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Pending Applications</span>
                        <span className="font-semibold text-amber-600">{marketplaceHealth.pendingSellerApplications}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Pending Approvals</span>
                        <span className="font-semibold text-amber-600">{marketplaceHealth.pendingProductApprovals}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Suspended Users</span>
                        <span className="font-semibold text-red-600">{marketplaceHealth.suspendedUsers}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={async () => {
                      await fetchMarketplaceHealth();
                      toast.success('Marketplace health refreshed.');
                    }}
                    disabled={loadingMarketplaceHealth}
                    className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-lg text-xs cursor-pointer transition-colors motion-reduce:transition-none"
                  >
                    Refresh
                  </button>
                </div>
              </article>

            </div>
          </section>
        )
      ) : activeTab === 'payments' ? (
        loadingPaymentSettings ? (
          <div className="flex items-center justify-center h-64 bg-white border border-gray-100 rounded-2xl shadow-sm">
            <div className="motion-safe:animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <section className="space-y-8" aria-label="Payments Settings Dashboard">
            <header className="flex justify-between items-center bg-indigo-50/40 border border-indigo-100/30 p-4 rounded-2xl">
              <div className="flex items-start gap-4 text-indigo-950">
                <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">Super Admin Payments Settings Dashboard</h4>
                  <p className="text-xs text-indigo-700 mt-1">Configure payment gateways, transaction size caps, payout schedules, commission rules, and fraud parameters securely.</p>
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              
              {/* Tile 1: Payment Methods */}
              <button 
                id="tile-payment-methods"
                onClick={() => setActiveModal('paymentMethods')}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 text-left hover:scale-[1.02] hover:shadow-md active:scale-[0.98] transition-all duration-200 motion-reduce:transition-none motion-reduce:transform-none cursor-pointer flex flex-col justify-between min-h-[160px]"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <CreditCard size={18} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">Payment Methods</h3>
                  </div>
                  <p className="text-xs text-gray-400">Enable Razorpay/COD gateways and limit cash transactions.</p>
                </div>
                <div className="text-[11px] font-semibold text-indigo-655 flex items-center gap-1 mt-2">
                  <span>Razorpay: {paymentSettings.enableRazorpay ? 'ON' : 'OFF'}</span>
                  <span className="text-gray-300">•</span>
                  <span>COD: {paymentSettings.enableCod ? `ON (Max: ₹${paymentSettings.maxCodAmount})` : 'OFF'}</span>
                </div>
              </button>

              {/* Tile 2: Order Payment Limits */}
              <button 
                id="tile-payment-limits"
                onClick={() => setActiveModal('paymentLimits')}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 text-left hover:scale-[1.02] hover:shadow-md active:scale-[0.98] transition-all duration-200 motion-reduce:transition-none motion-reduce:transform-none cursor-pointer flex flex-col justify-between min-h-[160px]"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600">
                      <Sliders size={18} />
                    </div>
                    <h3 className="font-bold text-gray-950 text-sm">Payment Limits</h3>
                  </div>
                  <p className="text-xs text-gray-400">Set min/max order sizes and single transaction limits.</p>
                </div>
                <div className="text-[11px] font-semibold text-indigo-655 flex items-center gap-1 mt-2">
                  <span>Min: ₹{paymentSettings.minOrderAmount}</span>
                  <span className="text-gray-300">•</span>
                  <span>Max: ₹{paymentSettings.maxOrderAmount}</span>
                  <span className="text-gray-300">•</span>
                  <span>Tx: ₹{paymentSettings.maxSingleTransactionAmount}</span>
                </div>
              </button>

              {/* Tile 3: Refund Settings */}
              <button 
                id="tile-payment-refunds"
                onClick={() => setActiveModal('refundSettings')}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 text-left hover:scale-[1.02] hover:shadow-md active:scale-[0.98] transition-all duration-200 motion-reduce:transition-none motion-reduce:transform-none cursor-pointer flex flex-col justify-between min-h-[160px]"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                      <RotateCw size={18} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">Refund Settings</h3>
                  </div>
                  <p className="text-xs text-gray-400">Configure refund requests windows, approvals, and processing.</p>
                </div>
                <div className="text-[11px] font-semibold text-indigo-655 flex items-center gap-1 mt-2">
                  <span>Refunds: {paymentSettings.enableRefundRequests ? 'ON' : 'OFF'}</span>
                  <span className="text-gray-300">•</span>
                  <span>Window: {paymentSettings.refundRequestWindowDays}d</span>
                  <span className="text-gray-300">•</span>
                  <span>Approval: {paymentSettings.requireAdminRefundApproval ? 'Required' : 'Auto'}</span>
                </div>
              </button>

              {/* Tile 4: Platform Commission */}
              <button 
                id="tile-payment-commission"
                onClick={() => setActiveModal('platformCommission')}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 text-left hover:scale-[1.02] hover:shadow-md active:scale-[0.98] transition-all duration-200 motion-reduce:transition-none motion-reduce:transform-none cursor-pointer flex flex-col justify-between min-h-[160px]"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                      <CreditCard size={18} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">Platform Commission</h3>
                  </div>
                  <p className="text-xs text-gray-400">Manage percentage or fixed commissions applied to products or orders.</p>
                </div>
                <div className="text-[11px] font-semibold text-indigo-655 flex items-center gap-1 mt-2">
                  <span>Type: {paymentSettings.commissionType}</span>
                  <span className="text-gray-300">•</span>
                  <span>Value: {paymentSettings.commissionValue}{paymentSettings.commissionType === 'Percentage' ? '%' : ' Fixed'}</span>
                  <span className="text-gray-300">•</span>
                  <span>Target: {paymentSettings.applyCommissionOn}</span>
                </div>
              </button>

              {/* Tile 5: Seller Payout Rules */}
              <button 
                id="tile-payment-payouts"
                onClick={() => setActiveModal('sellerPayoutRules')}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 text-left hover:scale-[1.02] hover:shadow-md active:scale-[0.98] transition-all duration-200 motion-reduce:transition-none motion-reduce:transform-none cursor-pointer flex flex-col justify-between min-h-[160px]"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <Briefcase size={18} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">Seller Payout Rules</h3>
                  </div>
                  <p className="text-xs text-gray-400">Set release delay, payout thresholds, and automatic release policies.</p>
                </div>
                <div className="text-[11px] font-semibold text-indigo-655 flex items-center gap-1 mt-2">
                  <span>Payouts: {paymentSettings.enableSellerPayouts ? 'ON' : 'OFF'}</span>
                  <span className="text-gray-300">•</span>
                  <span>Delay: {paymentSettings.payoutReleaseDelayDays}d</span>
                  <span className="text-gray-300">•</span>
                  <span>Min: ₹{paymentSettings.minPayoutThreshold}</span>
                </div>
              </button>

              {/* Tile 6: Fraud Protection */}
              <button 
                id="tile-payment-fraud"
                onClick={() => setActiveModal('fraudProtection')}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 text-left hover:scale-[1.02] hover:shadow-md active:scale-[0.98] transition-all duration-200 motion-reduce:transition-none motion-reduce:transform-none cursor-pointer flex flex-col justify-between min-h-[160px]"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
                      <Shield size={18} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">Fraud Protection</h3>
                  </div>
                  <p className="text-xs text-gray-400">Define manual review limits and failed payment retry thresholds.</p>
                </div>
                <div className="text-[11px] font-semibold text-indigo-655 flex items-center gap-1 mt-2">
                  <span>Attempts: {paymentSettings.maxFailedPaymentAttempts}</span>
                  <span className="text-gray-300">•</span>
                  <span>Review: ₹{paymentSettings.manualReviewThreshold}</span>
                  <span className="text-gray-300">•</span>
                  <span>Block: {paymentSettings.blockExcessiveFailedAttempts ? 'ON' : 'OFF'}</span>
                </div>
              </button>

              {/* Tile 7: Payment Health */}
              <button 
                id="tile-payment-health"
                onClick={() => setActiveModal('paymentHealthModal')}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 text-left hover:scale-[1.02] hover:shadow-md active:scale-[0.98] transition-all duration-200 motion-reduce:transition-none motion-reduce:transform-none cursor-pointer flex flex-col justify-between min-h-[160px]"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Activity size={18} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">Payment Health</h3>
                  </div>
                  <p className="text-xs text-gray-400">Inspect gateway success rates and average response times.</p>
                </div>
                <div className="text-[11px] font-semibold text-indigo-655 flex items-center gap-1 mt-2">
                  <span>Success: {paymentHealth.paymentSuccessRate}</span>
                  <span className="text-gray-300">•</span>
                  <span>Verification: {paymentHealth.averageVerificationTime}</span>
                  <span className="text-gray-300">•</span>
                  <span>Gateway: {paymentHealth.razorpayStatus}</span>
                </div>
              </button>

            </div>
          </section>
        )
      ) : activeTab === 'inventory' ? (
        loadingInventorySettings ? (
          <div className="flex items-center justify-center h-64 bg-white border border-gray-100 rounded-2xl shadow-sm">
            <div className="motion-safe:animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <section className="space-y-8" aria-label="Inventory Settings Dashboard">
            <header className="flex justify-between items-center bg-indigo-50/40 border border-indigo-100/30 p-4 rounded-2xl">
              <div className="flex items-start gap-4 text-indigo-950">
                <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">Super Admin Inventory Settings Dashboard</h4>
                  <p className="text-xs text-indigo-700 mt-1">Configure low stock levels, reservation windows, variant overrides, seller adjustment validation, alerts, and read-only diagnostics.</p>
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              
              {/* Tile 1: Low Stock Rules */}
              <button 
                id="tile-inventory-lowstock"
                onClick={() => setActiveModal('lowStockRules')}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 text-left hover:scale-[1.02] hover:shadow-md active:scale-[0.98] transition-all duration-200 motion-reduce:transition-none motion-reduce:transform-none cursor-pointer flex flex-col justify-between min-h-[160px]"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                      <Sliders size={18} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">Low Stock Rules</h3>
                  </div>
                  <p className="text-xs text-gray-400">Enable stock alerts and configure thresholds for low/critical quantities.</p>
                </div>
                <div className="text-[11px] font-semibold text-indigo-655 flex items-center gap-1 mt-2">
                  <span>Alerts: {inventorySettings.enableLowStockAlerts ? 'ON' : 'OFF'}</span>
                  <span className="text-gray-300">•</span>
                  <span>Low: {inventorySettings.defaultLowStockThreshold}</span>
                  <span className="text-gray-300">•</span>
                  <span>Critical: {inventorySettings.criticalStockThreshold}</span>
                </div>
              </button>

              {/* Tile 2: Stock Reservation */}
              <button 
                id="tile-inventory-reservation"
                onClick={() => setActiveModal('stockReservation')}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 text-left hover:scale-[1.02] hover:shadow-md active:scale-[0.98] transition-all duration-200 motion-reduce:transition-none motion-reduce:transform-none cursor-pointer flex flex-col justify-between min-h-[160px]"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Clock size={18} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">Stock Reservation</h3>
                  </div>
                  <p className="text-xs text-gray-400">Manage order reservation toggles, timeout expiries, and auto-releases.</p>
                </div>
                <div className="text-[11px] font-semibold text-indigo-655 flex items-center gap-1 mt-2">
                  <span>Reserve: {inventorySettings.enableStockReservation ? 'ON' : 'OFF'}</span>
                  <span className="text-gray-300">•</span>
                  <span>Expiry: {inventorySettings.reservationExpiryTime}m</span>
                  <span className="text-gray-300">•</span>
                  <span>Auto Release: {inventorySettings.autoReleaseExpiredReservations ? 'ON' : 'OFF'}</span>
                </div>
              </button>

              {/* Tile 3: Out Of Stock Rules */}
              <button 
                id="tile-inventory-outofstock"
                onClick={() => setActiveModal('outOfStockRules')}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 text-left hover:scale-[1.02] hover:shadow-md active:scale-[0.98] transition-all duration-200 motion-reduce:transition-none motion-reduce:transform-none cursor-pointer flex flex-col justify-between min-h-[160px]"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                      <Zap size={18} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">Out of Stock Rules</h3>
                  </div>
                  <p className="text-xs text-gray-400">Configure purchase rules when out of stock and search listing visibility.</p>
                </div>
                <div className="text-[11px] font-semibold text-indigo-655 flex items-center gap-1 mt-2">
                  <span>Backorder: {inventorySettings.allowPurchaseWhenOutOfStock ? 'ON' : 'OFF'}</span>
                  <span className="text-gray-300">•</span>
                  <span>Show OOS: {inventorySettings.showOutOfStockProducts ? 'ON' : 'OFF'}</span>
                  <span className="text-gray-300">•</span>
                  <span>Hide: {inventorySettings.hideProductsAfterStockReachesZero ? 'ON' : 'OFF'}</span>
                </div>
              </button>

              {/* Tile 4: Seller Controls */}
              <button 
                id="tile-inventory-seller"
                onClick={() => setActiveModal('sellerControls')}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 text-left hover:scale-[1.02] hover:shadow-md active:scale-[0.98] transition-all duration-200 motion-reduce:transition-none motion-reduce:transform-none cursor-pointer flex flex-col justify-between min-h-[160px]"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                      <Store size={18} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">Seller Controls</h3>
                  </div>
                  <p className="text-xs text-gray-400">Control manual updates, logging enforcements, and adjustment justifications.</p>
                </div>
                <div className="text-[11px] font-semibold text-indigo-655 flex items-center gap-1 mt-2">
                  <span>Updates: {inventorySettings.allowSellerInventoryUpdates ? 'ON' : 'OFF'}</span>
                  <span className="text-gray-300">•</span>
                  <span>Log Changes: {inventorySettings.requireInventoryChangeLogging ? 'ON' : 'OFF'}</span>
                  <span className="text-gray-300">•</span>
                  <span>Reason: {inventorySettings.requireReasonForManualAdjustment ? 'ON' : 'OFF'}</span>
                </div>
              </button>

              {/* Tile 5: Variant Inventory */}
              <button 
                id="tile-inventory-variant"
                onClick={() => setActiveModal('variantInventory')}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 text-left hover:scale-[1.02] hover:shadow-md active:scale-[0.98] transition-all duration-200 motion-reduce:transition-none motion-reduce:transform-none cursor-pointer flex flex-col justify-between min-h-[160px]"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <Sliders size={18} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">Variant Inventory</h3>
                  </div>
                  <p className="text-xs text-gray-400">Handle tracking separate variants and preventing variant overselling.</p>
                </div>
                <div className="text-[11px] font-semibold text-indigo-655 flex items-center gap-1 mt-2">
                  <span>Separate: {inventorySettings.trackVariantInventorySeparately ? 'ON' : 'OFF'}</span>
                  <span className="text-gray-300">•</span>
                  <span>Oversell: {inventorySettings.preventOversellingVariants ? 'ON' : 'OFF'}</span>
                  <span className="text-gray-300">•</span>
                  <span>Stock First: {inventorySettings.requireVariantStockBeforeListing ? 'ON' : 'OFF'}</span>
                </div>
              </button>

              {/* Tile 6: Inventory Alerts */}
              <button 
                id="tile-inventory-alerts"
                onClick={() => setActiveModal('inventoryAlerts')}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 text-left hover:scale-[1.02] hover:shadow-md active:scale-[0.98] transition-all duration-200 motion-reduce:transition-none motion-reduce:transform-none cursor-pointer flex flex-col justify-between min-h-[160px]"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                      <Bell size={18} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">Inventory Alerts</h3>
                  </div>
                  <p className="text-xs text-gray-400">Configure notifications rules and dispatch frequencies for critical alerts.</p>
                </div>
                <div className="text-[11px] font-semibold text-indigo-655 flex items-center gap-1 mt-2">
                  <span>Low Notification: {inventorySettings.enableLowStockNotifications ? 'ON' : 'OFF'}</span>
                  <span className="text-gray-300">•</span>
                  <span>Crit Notification: {inventorySettings.enableCriticalStockNotifications ? 'ON' : 'OFF'}</span>
                  <span className="text-gray-300">•</span>
                  <span>Frequency: {inventorySettings.notificationFrequency}</span>
                </div>
              </button>

              {/* Tile 7: Inventory Logs */}
              <button 
                id="tile-inventory-logs"
                onClick={() => setActiveModal('inventoryLogs')}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 text-left hover:scale-[1.02] hover:shadow-md active:scale-[0.98] transition-all duration-200 motion-reduce:transition-none motion-reduce:transform-none cursor-pointer flex flex-col justify-between min-h-[160px]"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600">
                      <FileText size={18} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">Inventory Logs</h3>
                  </div>
                  <p className="text-xs text-gray-400">Configure global transaction logs audit retention constraints.</p>
                </div>
                <div className="text-[11px] font-semibold text-indigo-655 flex items-center gap-1 mt-2">
                  <span>Logs: {inventorySettings.enableInventoryLogs ? 'ON' : 'OFF'}</span>
                  <span className="text-gray-300">•</span>
                  <span>Retention: {inventorySettings.logRetentionPeriod} Days</span>
                </div>
              </button>

              {/* Tile 8: Protection Rules */}
              <button 
                id="tile-inventory-protection"
                onClick={() => setActiveModal('protectionRules')}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 text-left hover:scale-[1.02] hover:shadow-md active:scale-[0.98] transition-all duration-200 motion-reduce:transition-none motion-reduce:transform-none cursor-pointer flex flex-col justify-between min-h-[160px]"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <Shield size={18} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">Protection Rules</h3>
                  </div>
                  <p className="text-xs text-gray-400">Inspect system protection rules and payment verification validations.</p>
                </div>
                <div className="text-[11px] font-semibold text-indigo-655 flex items-center gap-1 mt-2">
                  <span>Negative Stock: {inventorySettings.preventNegativeStock ? 'ON' : 'OFF'}</span>
                  <span className="text-gray-300">•</span>
                  <span>Overselling: {inventorySettings.preventOverselling ? 'ON' : 'OFF'}</span>
                  <span className="text-gray-300">•</span>
                  <span>Pre-Payment Check: {inventorySettings.validateStockBeforePaymentVerification ? 'ON' : 'OFF'}</span>
                </div>
              </button>

              {/* Tile 9: Inventory Health */}
              <button 
                id="tile-inventory-health"
                onClick={() => setActiveModal('inventoryHealthModal')}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 text-left hover:scale-[1.02] hover:shadow-md active:scale-[0.98] transition-all duration-200 motion-reduce:transition-none motion-reduce:transform-none cursor-pointer flex flex-col justify-between min-h-[160px]"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Activity size={18} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">Inventory Health</h3>
                  </div>
                  <p className="text-xs text-gray-400">View live metrics on stock levels, critical variants, and today's transactions.</p>
                </div>
                <div className="text-[11px] font-semibold text-indigo-655 flex items-center gap-1 mt-2">
                  <span>Out of stock: {inventoryHealth.outOfStockProducts}</span>
                  <span className="text-gray-300">•</span>
                  <span>Low: {inventoryHealth.lowStockProducts}</span>
                  <span className="text-gray-300">•</span>
                  <span>Transactions: {inventoryHealth.inventoryTransactionsToday}</span>
                </div>
              </button>

            </div>
          </section>
        )
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-12 text-center">
          <p className="text-gray-500 font-medium text-sm">This section is currently empty or inherited from global configurations.</p>
        </div>
      )}

      {/* OVERLAY POPUP MODALS */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-gray-150 flex flex-col relative max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-950 uppercase tracking-wider flex items-center gap-2">
                {activeModal === 'platform' && <><Info className="text-blue-600 w-4 h-4" /> Platform Information</>}
                {activeModal === 'contact' && <><MapPin className="text-amber-600 w-4 h-4" /> Contact & Address</>}
                {activeModal === 'business' && <><Briefcase className="text-purple-600 w-4 h-4" /> Business Details</>}
                {activeModal === 'system' && <><Sliders className="text-pink-600 w-4 h-4" /> System Preferences</>}
                {activeModal === 'email' && <><Mail className="text-sky-600 w-4 h-4" /> Email Settings</>}
                {activeModal === 'lifecycle' && <><Clock className="text-indigo-600 w-4 h-4" /> Order Lifecycle Settings</>}
                {activeModal === 'limits' && <><Sliders className="text-pink-600 w-4 h-4" /> Order Limits Settings</>}
                {activeModal === 'protection' && <><Shield className="text-emerald-600 w-4 h-4" /> Protection Rules</>}
                {activeModal === 'seller' && <><Store className="text-orange-600 w-4 h-4" /> Seller Order Rules</>}
                {activeModal === 'refund' && <><CreditCard className="text-teal-600 w-4 h-4" /> Refund Settings</>}
                {activeModal === 'transitions' && <><Wrench className="text-amber-600 w-4 h-4" /> Order Status Control</>}
                {activeModal === 'paymentMethods' && <><CreditCard className="text-blue-600 w-4 h-4" /> Payment Methods</>}
                {activeModal === 'paymentLimits' && <><Sliders className="text-pink-600 w-4 h-4" /> Payment Limits</>}
                {activeModal === 'refundSettings' && <><RotateCw className="text-orange-600 w-4 h-4" /> Refund Settings</>}
                {activeModal === 'platformCommission' && <><CreditCard className="text-amber-600 w-4 h-4" /> Platform Commission</>}
                {activeModal === 'sellerPayoutRules' && <><Briefcase className="text-emerald-600 w-4 h-4" /> Seller Payout Rules</>}
                {activeModal === 'fraudProtection' && <><Shield className="text-sky-600 w-4 h-4" /> Fraud Protection</>}
                {activeModal === 'paymentHealthModal' && <><Activity className="text-indigo-600 w-4 h-4" /> Payment Health Diagnostics</>}
                {activeModal === 'lowStockRules' && <><Sliders className="text-orange-600 w-4 h-4" /> Low Stock Rules</>}
                {activeModal === 'stockReservation' && <><Clock className="text-indigo-600 w-4 h-4" /> Stock Reservation</>}
                {activeModal === 'outOfStockRules' && <><Zap className="text-rose-600 w-4 h-4" /> Out of Stock Rules</>}
                {activeModal === 'sellerControls' && <><Store className="text-purple-600 w-4 h-4" /> Seller Controls</>}
                {activeModal === 'variantInventory' && <><Sliders className="text-blue-600 w-4 h-4" /> Variant Inventory</>}
                {activeModal === 'inventoryAlerts' && <><Bell className="text-teal-600 w-4 h-4" /> Inventory Alerts</>}
                {activeModal === 'inventoryLogs' && <><FileText className="text-violet-600 w-4 h-4" /> Inventory Logs</>}
                {activeModal === 'protectionRules' && <><Shield className="text-emerald-600 w-4 h-4" /> Protection Rules</>}
                {activeModal === 'inventoryHealthModal' && <><Activity className="text-indigo-600 w-4 h-4" /> Inventory Health Diagnostics</>}
              </h3>
              <button 
                onClick={() => setActiveModal(null)} 
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              
              {/* Platform Info Modal */}
              {activeModal === 'platform' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Platform Name</label>
                    <input 
                      type="text" 
                      value={settings.platformName}
                      onChange={(e) => handleInputChange('platformName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Support Email</label>
                    <input 
                      type="email" 
                      value={settings.supportEmail}
                      onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Support Phone</label>
                    <input 
                      type="text" 
                      value={settings.supportPhone}
                      onChange={(e) => handleInputChange('supportPhone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Contact & Address Modal */}
              {activeModal === 'contact' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Company Address</label>
                    <textarea 
                      value={settings.companyAddress}
                      onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Website URL</label>
                    <input 
                      type="text" 
                      value={settings.websiteUrl}
                      onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs font-semibold text-gray-705">Email Notifications</span>
                    <button 
                      type="button"
                      onClick={() => handleInputChange('emailNotifications', !settings.emailNotifications)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.emailNotifications ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.emailNotifications ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              )}

              {/* Business Details Modal */}
              {activeModal === 'business' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Company Name</label>
                    <input 
                      type="text" 
                      value={settings.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">GSTIN</label>
                    <input 
                      type="text" 
                      value={settings.gstin}
                      onChange={(e) => handleInputChange('gstin', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tax Rate (%)</label>
                    <input 
                      type="text" 
                      value={settings.taxRate}
                      onChange={(e) => handleInputChange('taxRate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* System Preferences Modal */}
              {activeModal === 'system' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-1 border-b border-gray-50">
                    <span className="text-xs font-semibold text-gray-700">Maintenance Mode</span>
                    <button 
                      type="button"
                      onClick={() => handleInputChange('maintenanceMode', !settings.maintenanceMode)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.maintenanceMode ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.maintenanceMode ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-gray-50">
                    <span className="text-xs font-semibold text-gray-700">Allow Registrations</span>
                    <button 
                      type="button"
                      onClick={() => handleInputChange('allowRegistrations', !settings.allowRegistrations)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.allowRegistrations ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.allowRegistrations ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-gray-50">
                    <span className="text-xs font-semibold text-gray-700">Allow Seller Applications</span>
                    <button 
                      type="button"
                      onClick={() => handleInputChange('allowSellerApplications', !settings.allowSellerApplications)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.allowSellerApplications ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.allowSellerApplications ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Default Language</label>
                    <div className="relative">
                      <select 
                        value={settings.defaultLanguage}
                        onChange={(e) => handleInputChange('defaultLanguage', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none bg-white appearance-none"
                      >
                        <option>English</option>
                        <option>Spanish</option>
                        <option>French</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}

              {/* Email Settings Modal */}
              {activeModal === 'email' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">From Email</label>
                    <input 
                      type="email" 
                      value={settings.fromEmail}
                      onChange={(e) => handleInputChange('fromEmail', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">From Name</label>
                    <input 
                      type="text" 
                      value={settings.fromName}
                      onChange={(e) => handleInputChange('fromName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">SMTP Status</label>
                    <div className="pt-1">
                      {settings.smtpStatus === 'Connected' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          Connected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          Disconnected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Order Lifecycle Modal */}
              {activeModal === 'lifecycle' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Auto Cancel Unconfirmed Orders (Mins)</label>
                    <input 
                      type="number" 
                      min={1} 
                      max={1440}
                      value={orderSettings.autoCancelUnconfirmedMins}
                      onChange={(e) => setOrderSettings(prev => ({ ...prev, autoCancelUnconfirmedMins: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Auto Complete Delivered Orders (Days)</label>
                    <input 
                      type="number" 
                      min={1} 
                      max={90}
                      value={orderSettings.autoCompleteDeliveredDays}
                      onChange={(e) => setOrderSettings(prev => ({ ...prev, autoCompleteDeliveredDays: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs font-semibold text-gray-700">Allow Customer Cancellation</span>
                    <button 
                      type="button"
                      onClick={() => setOrderSettings(prev => ({ ...prev, allowCustomerCancellation: !prev.allowCustomerCancellation }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        orderSettings.allowCustomerCancellation ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${orderSettings.allowCustomerCancellation ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  {orderSettings.allowCustomerCancellation && (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Customer Cancellation Window (Mins)</label>
                      <input 
                        type="number" 
                        min={1} 
                        max={1440}
                        value={orderSettings.customerCancellationWindowMins}
                        onChange={(e) => setOrderSettings(prev => ({ ...prev, customerCancellationWindowMins: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Order Limits Modal */}
              {activeModal === 'limits' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Minimum Order Value (₹)</label>
                    <input 
                      type="number" 
                      min={0}
                      value={orderSettings.minOrderValue}
                      onChange={(e) => setOrderSettings(prev => ({ ...prev, minOrderValue: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Maximum Order Value (₹)</label>
                    <input 
                      type="number" 
                      min={1}
                      value={orderSettings.maxOrderValue}
                      onChange={(e) => setOrderSettings(prev => ({ ...prev, maxOrderValue: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Maximum Items Per Order</label>
                    <input 
                      type="number" 
                      min={1}
                      value={orderSettings.maxItemsPerOrder}
                      onChange={(e) => setOrderSettings(prev => ({ ...prev, maxItemsPerOrder: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Maximum Quantity Per Product</label>
                    <input 
                      type="number" 
                      min={1}
                      value={orderSettings.maxQtyPerProduct}
                      onChange={(e) => setOrderSettings(prev => ({ ...prev, maxQtyPerProduct: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Protection Rules Modal */}
              {activeModal === 'protection' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-1 border-b border-gray-50">
                    <span className="text-xs font-semibold text-gray-700">Require Verified Email</span>
                    <button 
                      type="button"
                      onClick={() => setOrderSettings(prev => ({ ...prev, requireVerifiedEmail: !prev.requireVerifiedEmail }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        orderSettings.requireVerifiedEmail ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${orderSettings.requireVerifiedEmail ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-gray-50">
                    <span className="text-xs font-semibold text-gray-700">Require Active Address</span>
                    <button 
                      type="button"
                      onClick={() => setOrderSettings(prev => ({ ...prev, requireActiveAddress: !prev.requireActiveAddress }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        orderSettings.requireActiveAddress ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${orderSettings.requireActiveAddress ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-gray-50">
                    <span className="text-xs font-semibold text-gray-700">Block Suspended Users</span>
                    <button 
                      type="button"
                      onClick={() => setOrderSettings(prev => ({ ...prev, blockSuspendedUsers: !prev.blockSuspendedUsers }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        orderSettings.blockSuspendedUsers ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${orderSettings.blockSuspendedUsers ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs font-semibold text-gray-700">Allow Guest Orders</span>
                    <button 
                      type="button"
                      onClick={() => setOrderSettings(prev => ({ ...prev, allowGuestOrders: !prev.allowGuestOrders }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        orderSettings.allowGuestOrders ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${orderSettings.allowGuestOrders ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              )}

              {/* Seller Order Rules Modal */}
              {activeModal === 'seller' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Auto Expire Seller Acceptance (Mins)</label>
                    <input 
                      type="number" 
                      min={1} 
                      max={1440}
                      value={orderSettings.autoExpireSellerAcceptanceMins}
                      onChange={(e) => setOrderSettings(prev => ({ ...prev, autoExpireSellerAcceptanceMins: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Seller Acceptance Timeout Action</label>
                    <div className="relative">
                      <select 
                        value={orderSettings.sellerAcceptanceAction}
                        onChange={(e) => setOrderSettings(prev => ({ ...prev, sellerAcceptanceAction: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none bg-white appearance-none text-gray-700"
                      >
                        <option value="CANCEL">Auto Cancel Order</option>
                        <option value="ESCALATE">Auto Escalate</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}

              {/* Refund Settings Modal */}
              {activeModal === 'refund' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-1 border-b border-gray-50">
                    <span className="text-xs font-semibold text-gray-700">Allow Refund Requests</span>
                    <button 
                      type="button"
                      onClick={() => setOrderSettings(prev => ({ ...prev, allowRefundRequests: !prev.allowRefundRequests }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        orderSettings.allowRefundRequests ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${orderSettings.allowRefundRequests ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  {orderSettings.allowRefundRequests && (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Refund Request Window (Days after Delivery)</label>
                      <input 
                        type="number" 
                        min={1} 
                        max={90}
                        value={orderSettings.refundRequestWindowDays}
                        onChange={(e) => setOrderSettings(prev => ({ ...prev, refundRequestWindowDays: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs font-semibold text-gray-700">Require Admin Approval</span>
                    <button 
                      type="button"
                      onClick={() => setOrderSettings(prev => ({ ...prev, requireAdminRefundApproval: !prev.requireAdminRefundApproval }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        orderSettings.requireAdminRefundApproval ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${orderSettings.requireAdminRefundApproval ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              )}

              {/* Order Status Control Modal */}
              {activeModal === 'transitions' && (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                  <p className="text-xs text-gray-400 mb-3">Toggles specify valid destination status pathways starting from the source state.</p>
                  
                  {/* PLACED */}
                  <fieldset className="border border-gray-100 rounded-xl p-3 space-y-2.5">
                    <legend className="px-2 text-[10px] font-bold text-indigo-600 uppercase tracking-wider">From PLACED</legend>
                    {['CONFIRMED', 'CANCELLED'].map(next => {
                      const isChecked = orderSettings.allowedTransitions.PLACED?.includes(next);
                      return (
                        <div key={next} className="flex items-center justify-between">
                          <span className="text-xs text-gray-650 font-medium">{next}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const current = orderSettings.allowedTransitions.PLACED || [];
                              const nextArr = isChecked ? current.filter(x => x !== next) : [...current, next];
                              setOrderSettings(prev => ({
                                ...prev,
                                allowedTransitions: { ...prev.allowedTransitions, PLACED: nextArr }
                              }));
                            }}
                            className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-150 ease-in-out focus:outline-none ${isChecked ? 'bg-indigo-600' : 'bg-gray-200'}`}
                          >
                            <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-150 ease-in-out ${isChecked ? 'translate-x-3' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      );
                    })}
                  </fieldset>

                  {/* CONFIRMED */}
                  <fieldset className="border border-gray-100 rounded-xl p-3 space-y-2.5">
                    <legend className="px-2 text-[10px] font-bold text-indigo-600 uppercase tracking-wider">From CONFIRMED</legend>
                    {['PREPARING'].map(next => {
                      const isChecked = orderSettings.allowedTransitions.CONFIRMED?.includes(next);
                      return (
                        <div key={next} className="flex items-center justify-between">
                          <span className="text-xs text-gray-655 font-medium">{next}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const current = orderSettings.allowedTransitions.CONFIRMED || [];
                              const nextArr = isChecked ? current.filter(x => x !== next) : [...current, next];
                              setOrderSettings(prev => ({
                                ...prev,
                                allowedTransitions: { ...prev.allowedTransitions, CONFIRMED: nextArr }
                              }));
                            }}
                            className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-150 ease-in-out focus:outline-none ${isChecked ? 'bg-indigo-600' : 'bg-gray-200'}`}
                          >
                            <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-150 ease-in-out ${isChecked ? 'translate-x-3' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      );
                    })}
                  </fieldset>

                  {/* PREPARING */}
                  <fieldset className="border border-gray-100 rounded-xl p-3 space-y-2.5">
                    <legend className="px-2 text-[10px] font-bold text-indigo-600 uppercase tracking-wider">From PREPARING</legend>
                    {['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].map(next => {
                      const isChecked = orderSettings.allowedTransitions.PREPARING?.includes(next);
                      return (
                        <div key={next} className="flex items-center justify-between">
                          <span className="text-xs text-gray-655 font-medium">{next.replace(/_/g, ' ')}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const current = orderSettings.allowedTransitions.PREPARING || [];
                              const nextArr = isChecked ? current.filter(x => x !== next) : [...current, next];
                              setOrderSettings(prev => ({
                                ...prev,
                                allowedTransitions: { ...prev.allowedTransitions, PREPARING: nextArr }
                              }));
                            }}
                            className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-150 ease-in-out focus:outline-none ${isChecked ? 'bg-indigo-600' : 'bg-gray-200'}`}
                          >
                            <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-150 ease-in-out ${isChecked ? 'translate-x-3' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      );
                    })}
                  </fieldset>

                  {/* READY_FOR_PICKUP */}
                  <fieldset className="border border-gray-100 rounded-xl p-3 space-y-2.5">
                    <legend className="px-2 text-[10px] font-bold text-indigo-600 uppercase tracking-wider">From READY FOR PICKUP</legend>
                    {['DELIVERED'].map(next => {
                      const isChecked = orderSettings.allowedTransitions.READY_FOR_PICKUP?.includes(next);
                      return (
                        <div key={next} className="flex items-center justify-between">
                          <span className="text-xs text-gray-655 font-medium">{next}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const current = orderSettings.allowedTransitions.READY_FOR_PICKUP || [];
                              const nextArr = isChecked ? current.filter(x => x !== next) : [...current, next];
                              setOrderSettings(prev => ({
                                ...prev,
                                allowedTransitions: { ...prev.allowedTransitions, READY_FOR_PICKUP: nextArr }
                              }));
                            }}
                            className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 ease-in-out focus:outline-none ${isChecked ? 'bg-indigo-600' : 'bg-gray-200'}`}
                          >
                            <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-150 ease-in-out ${isChecked ? 'translate-x-3' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      );
                    })}
                  </fieldset>

                  {/* OUT_FOR_DELIVERY */}
                  <fieldset className="border border-gray-100 rounded-xl p-3 space-y-2.5">
                    <legend className="px-2 text-[10px] font-bold text-indigo-600 uppercase tracking-wider">From OUT FOR DELIVERY</legend>
                    {['DELIVERED'].map(next => {
                      const isChecked = orderSettings.allowedTransitions.OUT_FOR_DELIVERY?.includes(next);
                      return (
                        <div key={next} className="flex items-center justify-between">
                          <span className="text-xs text-gray-655 font-medium">{next.replace(/_/g, ' ')}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const current = orderSettings.allowedTransitions.OUT_FOR_DELIVERY || [];
                              const nextArr = isChecked ? current.filter(x => x !== next) : [...current, next];
                              setOrderSettings(prev => ({
                                ...prev,
                                allowedTransitions: { ...prev.allowedTransitions, OUT_FOR_DELIVERY: nextArr }
                              }));
                            }}
                            className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-150 ease-in-out focus:outline-none ${isChecked ? 'bg-indigo-600' : 'bg-gray-200'}`}
                          >
                            <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-150 ease-in-out ${isChecked ? 'translate-x-3' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      );
                    })}
                  </fieldset>
                </div>
              )}

              {/* Payment Methods Modal */}
              {activeModal === 'paymentMethods' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-1 border-b border-gray-50">
                    <span className="text-xs font-semibold text-gray-700">Enable Razorpay Gateway</span>
                    <button 
                      type="button"
                      id="input-enable-razorpay"
                      onClick={() => setPaymentSettings(prev => ({ ...prev, enableRazorpay: !prev.enableRazorpay }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none motion-reduce:transition-none ${
                        paymentSettings.enableRazorpay ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out motion-reduce:transition-none ${paymentSettings.enableRazorpay ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-gray-50">
                    <span className="text-xs font-semibold text-gray-700">Enable Cash on Delivery (COD)</span>
                    <button 
                      type="button"
                      id="input-enable-cod"
                      onClick={() => setPaymentSettings(prev => ({ ...prev, enableCod: !prev.enableCod }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none motion-reduce:transition-none ${
                        paymentSettings.enableCod ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out motion-reduce:transition-none ${paymentSettings.enableCod ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  {paymentSettings.enableCod && (
                    <div className="space-y-2">
                      <label htmlFor="input-max-cod" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Maximum COD Order Amount (₹)</label>
                      <input 
                        type="number" 
                        id="input-max-cod"
                        min={1} 
                        max={50000}
                        value={paymentSettings.maxCodAmount}
                        onChange={(e) => setPaymentSettings(prev => ({ ...prev, maxCodAmount: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Payment Limits Modal */}
              {activeModal === 'paymentLimits' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="input-min-order" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Minimum Order Amount (₹)</label>
                    <input 
                      type="number" 
                      id="input-min-order"
                      min={0}
                      value={paymentSettings.minOrderAmount}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, minOrderAmount: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="input-max-order" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Maximum Order Amount (₹)</label>
                    <input 
                      type="number" 
                      id="input-max-order"
                      min={1}
                      value={paymentSettings.maxOrderAmount}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, maxOrderAmount: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="input-max-tx" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Maximum Single Transaction Amount (₹)</label>
                    <input 
                      type="number" 
                      id="input-max-tx"
                      min={1}
                      value={paymentSettings.maxSingleTransactionAmount}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, maxSingleTransactionAmount: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Refund Settings Modal */}
              {activeModal === 'refundSettings' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-1 border-b border-gray-50">
                    <span className="text-xs font-semibold text-gray-700">Enable Refund Requests</span>
                    <button 
                      type="button"
                      id="input-enable-refund"
                      onClick={() => setPaymentSettings(prev => ({ ...prev, enableRefundRequests: !prev.enableRefundRequests }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none motion-reduce:transition-none ${
                        paymentSettings.enableRefundRequests ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out motion-reduce:transition-none ${paymentSettings.enableRefundRequests ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  {paymentSettings.enableRefundRequests && (
                    <div className="space-y-2">
                      <label htmlFor="input-refund-window" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Refund Request Window (Days after Delivery)</label>
                      <input 
                        type="number" 
                        id="input-refund-window"
                        min={1} 
                        max={30}
                        value={paymentSettings.refundRequestWindowDays}
                        onChange={(e) => setPaymentSettings(prev => ({ ...prev, refundRequestWindowDays: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between py-1 border-b border-gray-50">
                    <span className="text-xs font-semibold text-gray-700">Require Admin Refund Approval</span>
                    <button 
                      type="button"
                      id="input-require-admin-refund"
                      onClick={() => setPaymentSettings(prev => ({ ...prev, requireAdminRefundApproval: !prev.requireAdminRefundApproval }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none motion-reduce:transition-none ${
                        paymentSettings.requireAdminRefundApproval ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out motion-reduce:transition-none ${paymentSettings.requireAdminRefundApproval ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs font-semibold text-gray-700">Auto Refund Processing</span>
                    <button 
                      type="button"
                      id="input-auto-refund"
                      onClick={() => setPaymentSettings(prev => ({ ...prev, autoRefundProcessing: !prev.autoRefundProcessing }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none motion-reduce:transition-none ${
                        paymentSettings.autoRefundProcessing ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out motion-reduce:transition-none ${paymentSettings.autoRefundProcessing ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              )}

              {/* Platform Commission Modal */}
              {activeModal === 'platformCommission' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="input-commission-type" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Commission Type</label>
                    <div className="relative">
                      <select 
                        id="input-commission-type"
                        value={paymentSettings.commissionType}
                        onChange={(e) => setPaymentSettings(prev => ({ ...prev, commissionType: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none bg-white appearance-none text-gray-750"
                      >
                        <option value="Percentage">Percentage (%)</option>
                        <option value="Fixed">Fixed Amount (₹)</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="input-commission-val" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Commission Value</label>
                    <input 
                      type="number" 
                      id="input-commission-val"
                      min={0}
                      value={paymentSettings.commissionValue}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, commissionValue: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="input-commission-target" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Apply Commission On</label>
                    <div className="relative">
                      <select 
                        id="input-commission-target"
                        value={paymentSettings.applyCommissionOn}
                        onChange={(e) => setPaymentSettings(prev => ({ ...prev, applyCommissionOn: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none bg-white appearance-none text-gray-755"
                      >
                        <option value="Product Total">Product Total</option>
                        <option value="Subtotal">Subtotal</option>
                        <option value="Grand Total">Grand Total</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}

              {/* Seller Payout Rules Modal */}
              {activeModal === 'sellerPayoutRules' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-1 border-b border-gray-50">
                    <span className="text-xs font-semibold text-gray-700">Enable Seller Payouts</span>
                    <button 
                      type="button"
                      id="input-enable-payouts"
                      onClick={() => setPaymentSettings(prev => ({ ...prev, enableSellerPayouts: !prev.enableSellerPayouts }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none motion-reduce:transition-none ${
                        paymentSettings.enableSellerPayouts ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out motion-reduce:transition-none ${paymentSettings.enableSellerPayouts ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="input-min-payout" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Minimum Payout Threshold (₹)</label>
                    <input 
                      type="number" 
                      id="input-min-payout"
                      min={0}
                      value={paymentSettings.minPayoutThreshold}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, minPayoutThreshold: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="input-payout-delay" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Payout Release Delay (Days)</label>
                    <input 
                      type="number" 
                      id="input-payout-delay"
                      min={0}
                      value={paymentSettings.payoutReleaseDelayDays}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, payoutReleaseDelayDays: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs font-semibold text-gray-700">Auto Payout Processing</span>
                    <button 
                      type="button"
                      id="input-auto-payout"
                      onClick={() => setPaymentSettings(prev => ({ ...prev, autoPayoutProcessing: !prev.autoPayoutProcessing }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none motion-reduce:transition-none ${
                        paymentSettings.autoPayoutProcessing ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out motion-reduce:transition-none ${paymentSettings.autoPayoutProcessing ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              )}

              {/* Fraud Protection Modal */}
              {activeModal === 'fraudProtection' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="input-max-failed-attempts" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Maximum Failed Payment Attempts</label>
                    <input 
                      type="number" 
                      id="input-max-failed-attempts"
                      min={1}
                      value={paymentSettings.maxFailedPaymentAttempts}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, maxFailedPaymentAttempts: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="input-manual-review-threshold" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Manual Review Threshold (₹)</label>
                    <input 
                      type="number" 
                      id="input-manual-review-threshold"
                      min={0}
                      value={paymentSettings.manualReviewThreshold}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, manualReviewThreshold: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs font-semibold text-gray-700">Block Excessive Failed Attempts</span>
                    <button 
                      type="button"
                      id="input-block-excessive-failed"
                      onClick={() => setPaymentSettings(prev => ({ ...prev, blockExcessiveFailedAttempts: !prev.blockExcessiveFailedAttempts }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none motion-reduce:transition-none ${
                        paymentSettings.blockExcessiveFailedAttempts ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out motion-reduce:transition-none ${paymentSettings.blockExcessiveFailedAttempts ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              )}

              {/* Payment Health Diagnostics Modal */}
              {activeModal === 'paymentHealthModal' && (
                <div className="space-y-4">
                  {loadingPaymentHealth ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 size={24} className="motion-safe:animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-xs text-gray-500 font-medium">Razorpay API Gateway</span>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          paymentHealth.razorpayStatus === 'Healthy' 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {paymentHealth.razorpayStatus}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-xs text-gray-500 font-medium">Webhook Status</span>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          paymentHealth.webhookStatus === 'Active' 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {paymentHealth.webhookStatus}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-xs text-gray-500 font-medium">Payment Success Rate</span>
                        <span className="text-xs font-bold text-green-600">{paymentHealth.paymentSuccessRate}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-xs text-gray-500 font-medium">Payment Failure Rate</span>
                        <span className="text-xs font-semibold text-red-600">{paymentHealth.paymentFailureRate}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-xs text-gray-500 font-medium">Avg. Verification Time</span>
                        <span className="text-xs font-semibold text-gray-800">{paymentHealth.averageVerificationTime}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-xs text-gray-500 font-medium">Last Successful Payment</span>
                        <span className="text-xs font-semibold text-gray-800">
                          {paymentHealth.lastSuccessfulPayment 
                            ? new Date(paymentHealth.lastSuccessfulPayment).toLocaleString() 
                            : 'No recent transactions'}
                        </span>
                      </div>
                      
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={async () => {
                            await fetchPaymentHealth();
                            toast.success('Payment diagnostics updated.');
                          }}
                          className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-lg text-[11px] cursor-pointer transition-colors motion-reduce:transition-none"
                        >
                          Refresh Stats
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Low Stock Rules Modal */}
              {activeModal === 'lowStockRules' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="enableLowStockAlerts" className="text-xs font-bold text-gray-700 block">Enable Low Stock Alerts</label>
                      <span className="text-[10px] text-gray-400">Trigger warnings when items drop below threshold limits.</span>
                    </div>
                    <button
                      id="enableLowStockAlerts"
                      type="button"
                      onClick={() => setInventorySettings(prev => ({ ...prev, enableLowStockAlerts: !prev.enableLowStockAlerts }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${inventorySettings.enableLowStockAlerts ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out motion-reduce:transition-none ${inventorySettings.enableLowStockAlerts ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div>
                    <label htmlFor="defaultLowStockThreshold" className="text-xs font-bold text-gray-700 block">Default Low Stock Threshold</label>
                    <span className="text-[10px] text-gray-400 block mb-1">Products below this threshold are marked as low stock.</span>
                    <input
                      id="defaultLowStockThreshold"
                      type="number"
                      value={inventorySettings.defaultLowStockThreshold}
                      onChange={(e) => setInventorySettings(prev => ({ ...prev, defaultLowStockThreshold: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="criticalStockThreshold" className="text-xs font-bold text-gray-700 block">Critical Stock Threshold</label>
                    <span className="text-[10px] text-gray-400 block mb-1">Products below this threshold are marked critical. Must be lower than low stock threshold.</span>
                    <input
                      id="criticalStockThreshold"
                      type="number"
                      value={inventorySettings.criticalStockThreshold}
                      onChange={(e) => setInventorySettings(prev => ({ ...prev, criticalStockThreshold: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* Stock Reservation Modal */}
              {activeModal === 'stockReservation' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="enableStockReservation" className="text-xs font-bold text-gray-700 block">Enable Stock Reservation</label>
                      <span className="text-[10px] text-gray-400">Stock is reserved immediately when an order is created.</span>
                    </div>
                    <button
                      id="enableStockReservation"
                      type="button"
                      onClick={() => setInventorySettings(prev => ({ ...prev, enableStockReservation: !prev.enableStockReservation }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${inventorySettings.enableStockReservation ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out motion-reduce:transition-none ${inventorySettings.enableStockReservation ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div>
                    <label htmlFor="reservationExpiryTime" className="text-xs font-bold text-gray-700 block">Reservation Expiry Time (Minutes)</label>
                    <span className="text-[10px] text-gray-400 block mb-1">Reserved stock is released if payment is not completed. (1 - 1440 mins)</span>
                    <input
                      id="reservationExpiryTime"
                      type="number"
                      value={inventorySettings.reservationExpiryTime}
                      onChange={(e) => setInventorySettings(prev => ({ ...prev, reservationExpiryTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="autoReleaseExpiredReservations" className="text-xs font-bold text-gray-700 block">Auto Release Expired Reservations</label>
                      <span className="text-[10px] text-gray-400">Automatically cancel pending/unpaid reservations.</span>
                    </div>
                    <button
                      id="autoReleaseExpiredReservations"
                      type="button"
                      onClick={() => setInventorySettings(prev => ({ ...prev, autoReleaseExpiredReservations: !prev.autoReleaseExpiredReservations }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${inventorySettings.autoReleaseExpiredReservations ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out motion-reduce:transition-none ${inventorySettings.autoReleaseExpiredReservations ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              )}

              {/* Out of Stock Rules Modal */}
              {activeModal === 'outOfStockRules' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="allowPurchaseWhenOutOfStock" className="text-xs font-bold text-gray-700 block">Allow Purchase When Out Of Stock</label>
                      <span className="text-[10px] text-gray-400">Permit backorders on items that are out of stock.</span>
                    </div>
                    <button
                      id="allowPurchaseWhenOutOfStock"
                      type="button"
                      onClick={() => setInventorySettings(prev => ({ ...prev, allowPurchaseWhenOutOfStock: !prev.allowPurchaseWhenOutOfStock }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${inventorySettings.allowPurchaseWhenOutOfStock ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out motion-reduce:transition-none ${inventorySettings.allowPurchaseWhenOutOfStock ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="showOutOfStockProducts" className="text-xs font-bold text-gray-700 block">Show Out Of Stock Products</label>
                      <span className="text-[10px] text-gray-400">Keep out-of-stock items visible in search/catalog.</span>
                    </div>
                    <button
                      id="showOutOfStockProducts"
                      type="button"
                      onClick={() => setInventorySettings(prev => ({ ...prev, showOutOfStockProducts: !prev.showOutOfStockProducts }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${inventorySettings.showOutOfStockProducts ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out motion-reduce:transition-none ${inventorySettings.showOutOfStockProducts ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="hideProductsAfterStockReachesZero" className="text-xs font-bold text-gray-700 block">Hide Products After Stock Reaches Zero</label>
                      <span className="text-[10px] text-gray-400">Delist product automatically when stock level hits 0.</span>
                    </div>
                    <button
                      id="hideProductsAfterStockReachesZero"
                      type="button"
                      onClick={() => setInventorySettings(prev => ({ ...prev, hideProductsAfterStockReachesZero: !prev.hideProductsAfterStockReachesZero }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${inventorySettings.hideProductsAfterStockReachesZero ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out motion-reduce:transition-none ${inventorySettings.hideProductsAfterStockReachesZero ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              )}

              {/* Seller Controls Modal */}
              {activeModal === 'sellerControls' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="allowSellerInventoryUpdates" className="text-xs font-bold text-gray-700 block">Allow Seller Inventory Updates</label>
                      <span className="text-[10px] text-gray-400">Permit sellers to update their stock numbers directly.</span>
                    </div>
                    <button
                      id="allowSellerInventoryUpdates"
                      type="button"
                      onClick={() => setInventorySettings(prev => ({ ...prev, allowSellerInventoryUpdates: !prev.allowSellerInventoryUpdates }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${inventorySettings.allowSellerInventoryUpdates ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out motion-reduce:transition-none ${inventorySettings.allowSellerInventoryUpdates ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="requireInventoryChangeLogging" className="text-xs font-bold text-gray-700 block">Require Inventory Change Logging</label>
                      <span className="text-[10px] text-gray-400">Enforce auditing log stream for all adjustments.</span>
                    </div>
                    <button
                      id="requireInventoryChangeLogging"
                      type="button"
                      onClick={() => setInventorySettings(prev => ({ ...prev, requireInventoryChangeLogging: !prev.requireInventoryChangeLogging }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${inventorySettings.requireInventoryChangeLogging ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out motion-reduce:transition-none ${inventorySettings.requireInventoryChangeLogging ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="requireReasonForManualAdjustment" className="text-xs font-bold text-gray-700 block">Require Reason For Manual Adjustment</label>
                      <span className="text-[10px] text-gray-400">Every manual stock adjustment must include a reason.</span>
                    </div>
                    <button
                      id="requireReasonForManualAdjustment"
                      type="button"
                      onClick={() => setInventorySettings(prev => ({ ...prev, requireReasonForManualAdjustment: !prev.requireReasonForManualAdjustment }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${inventorySettings.requireReasonForManualAdjustment ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out motion-reduce:transition-none ${inventorySettings.requireReasonForManualAdjustment ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              )}

              {/* Variant Inventory Modal */}
              {activeModal === 'variantInventory' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="trackVariantInventorySeparately" className="text-xs font-bold text-gray-700 block">Track Variant Inventory Separately</label>
                      <span className="text-[10px] text-gray-400">Log stock separately per distinct product variant.</span>
                    </div>
                    <button
                      id="trackVariantInventorySeparately"
                      type="button"
                      onClick={() => setInventorySettings(prev => ({ ...prev, trackVariantInventorySeparately: !prev.trackVariantInventorySeparately }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${inventorySettings.trackVariantInventorySeparately ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out motion-reduce:transition-none ${inventorySettings.trackVariantInventorySeparately ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="preventOversellingVariants" className="text-xs font-bold text-gray-700 block">Prevent Overselling Variants</label>
                      <span className="text-[10px] text-gray-400">Block transaction if variant stock drops below zero.</span>
                    </div>
                    <button
                      id="preventOversellingVariants"
                      type="button"
                      onClick={() => setInventorySettings(prev => ({ ...prev, preventOversellingVariants: !prev.preventOversellingVariants }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${inventorySettings.preventOversellingVariants ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out motion-reduce:transition-none ${inventorySettings.preventOversellingVariants ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="requireVariantStockBeforeListing" className="text-xs font-bold text-gray-700 block">Require Variant Stock Before Listing</label>
                      <span className="text-[10px] text-gray-400">Variant must have positive stock to show in listings.</span>
                    </div>
                    <button
                      id="requireVariantStockBeforeListing"
                      type="button"
                      onClick={() => setInventorySettings(prev => ({ ...prev, requireVariantStockBeforeListing: !prev.requireVariantStockBeforeListing }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${inventorySettings.requireVariantStockBeforeListing ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out motion-reduce:transition-none ${inventorySettings.requireVariantStockBeforeListing ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              )}

              {/* Inventory Alerts Modal */}
              {activeModal === 'inventoryAlerts' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="enableLowStockNotifications" className="text-xs font-bold text-gray-700 block">Enable Low Stock Notifications</label>
                      <span className="text-[10px] text-gray-400">Trigger notification on low stock thresholds.</span>
                    </div>
                    <button
                      id="enableLowStockNotifications"
                      type="button"
                      onClick={() => setInventorySettings(prev => ({ ...prev, enableLowStockNotifications: !prev.enableLowStockNotifications }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${inventorySettings.enableLowStockNotifications ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out motion-reduce:transition-none ${inventorySettings.enableLowStockNotifications ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="enableCriticalStockNotifications" className="text-xs font-bold text-gray-700 block">Enable Critical Stock Notifications</label>
                      <span className="text-[10px] text-gray-400">Trigger notification on critical stock levels.</span>
                    </div>
                    <button
                      id="enableCriticalStockNotifications"
                      type="button"
                      onClick={() => setInventorySettings(prev => ({ ...prev, enableCriticalStockNotifications: !prev.enableCriticalStockNotifications }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${inventorySettings.enableCriticalStockNotifications ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out motion-reduce:transition-none ${inventorySettings.enableCriticalStockNotifications ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div>
                    <label htmlFor="notificationFrequency" className="text-xs font-bold text-gray-700 block">Notification Frequency</label>
                    <span className="text-[10px] text-gray-400 block mb-1">Set delay window for Low/Critical alert notifications.</span>
                    <select
                      id="notificationFrequency"
                      value={inventorySettings.notificationFrequency}
                      onChange={(e) => setInventorySettings(prev => ({ ...prev, notificationFrequency: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Instant">Instant</option>
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Inventory Logs Modal */}
              {activeModal === 'inventoryLogs' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="enableInventoryLogs" className="text-xs font-bold text-gray-700 block">Enable Inventory Logs</label>
                      <span className="text-[10px] text-gray-400">Record all stock adjustment events globally.</span>
                    </div>
                    <button
                      id="enableInventoryLogs"
                      type="button"
                      onClick={() => setInventorySettings(prev => ({ ...prev, enableInventoryLogs: !prev.enableInventoryLogs }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${inventorySettings.enableInventoryLogs ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out motion-reduce:transition-none ${inventorySettings.enableInventoryLogs ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div>
                    <label htmlFor="logRetentionPeriod" className="text-xs font-bold text-gray-700 block">Log Retention Period (Days)</label>
                    <span className="text-[10px] text-gray-400 block mb-1">Set log cleanup interval days.</span>
                    <input
                      id="logRetentionPeriod"
                      type="number"
                      value={inventorySettings.logRetentionPeriod}
                      onChange={(e) => setInventorySettings(prev => ({ ...prev, logRetentionPeriod: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-700 block">Tracked Event Types</span>
                    <span className="text-[10px] text-gray-400 block mb-2">Displaying list of tracked transaction categories:</span>
                    <div className="flex flex-wrap gap-2">
                      {['STOCK_IN', 'STOCK_OUT', 'ORDER_RESERVED', 'ORDER_RELEASED', 'MANUAL_ADJUSTMENT'].map(evt => (
                        <span key={evt} className="px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-lg text-[10px] font-mono font-bold text-gray-600 uppercase">
                          {evt}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Protection Rules Modal */}
              {activeModal === 'protectionRules' && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-[11px] text-amber-800 leading-relaxed font-medium">
                    Critical transaction settings (Negative Stock, Overselling prevention, Order blockage on insufficient stock) are system-enforced and cannot be disabled to ensure marketplace integrity.
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-700 block">Prevent Negative Stock</span>
                      <span className="text-[10px] text-gray-400">Strictly block inventory levels from dropping below 0.</span>
                    </div>
                    <span className="px-2.5 py-1 bg-green-50 border border-green-200 rounded-lg text-[10px] font-bold text-green-700 uppercase">
                      Always ON
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-700 block">Prevent Overselling</span>
                      <span className="text-[10px] text-gray-400">Block simultaneous checkout attempts exceeding available stock.</span>
                    </div>
                    <span className="px-2.5 py-1 bg-green-50 border border-green-200 rounded-lg text-[10px] font-bold text-green-700 uppercase">
                      Always ON
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-700 block">Block Orders With Insufficient Stock</span>
                      <span className="text-[10px] text-gray-400">Prevent customer order placements if items are out of stock.</span>
                    </div>
                    <span className="px-2.5 py-1 bg-green-50 border border-green-200 rounded-lg text-[10px] font-bold text-green-700 uppercase">
                      Always ON
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="validateStockBeforePaymentVerification" className="text-xs font-bold text-gray-700 block">Validate Stock Before Payment Verification</label>
                      <span className="text-[10px] text-gray-400">Perform secondary check before Razorpay confirmations.</span>
                    </div>
                    <button
                      id="validateStockBeforePaymentVerification"
                      type="button"
                      onClick={() => setInventorySettings(prev => ({ ...prev, validateStockBeforePaymentVerification: !prev.validateStockBeforePaymentVerification }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${inventorySettings.validateStockBeforePaymentVerification ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out motion-reduce:transition-none ${inventorySettings.validateStockBeforePaymentVerification ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              )}

              {/* Inventory Health Diagnostics Modal */}
              {activeModal === 'inventoryHealthModal' && (
                <div className="space-y-4">
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-[11px] text-indigo-900 leading-relaxed font-medium">
                    Read-only health summary metrics fetched dynamically from the database.
                  </div>
                  {loadingInventoryHealth ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 size={24} className="motion-safe:animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl">
                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total Products</span>
                          <span className="block text-lg font-bold text-gray-900 mt-1">{inventoryHealth.totalProducts}</span>
                        </div>
                        <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl">
                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Active Products</span>
                          <span className="block text-lg font-bold text-emerald-600 mt-1">{inventoryHealth.activeProducts}</span>
                        </div>
                        <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl">
                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Out Of Stock</span>
                          <span className="block text-lg font-bold text-rose-600 mt-1">{inventoryHealth.outOfStockProducts}</span>
                        </div>
                        <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl">
                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Low Stock Products</span>
                          <span className="block text-lg font-bold text-orange-600 mt-1">{inventoryHealth.lowStockProducts}</span>
                        </div>
                        <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl">
                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Critical Stock</span>
                          <span className="block text-lg font-bold text-red-600 mt-1">{inventoryHealth.criticalStockProducts}</span>
                        </div>
                        <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl">
                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Reserved Count</span>
                          <span className="block text-lg font-bold text-blue-600 mt-1">{inventoryHealth.reservedInventoryCount}</span>
                        </div>
                      </div>
                      <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl flex justify-between items-center">
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">Inventory Transactions Today</span>
                          <span className="text-lg font-bold text-purple-600 mt-1 block">{inventoryHealth.inventoryTransactionsToday}</span>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            await fetchInventoryHealth();
                            toast.success('Inventory diagnostics updated.');
                          }}
                          className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-lg text-[11px] cursor-pointer transition-colors motion-reduce:transition-none"
                        >
                          Refresh Stats
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
              <div className="text-[11px] font-semibold">
                {activeTab === 'orders' || activeTab === 'payments' || activeTab === 'inventory' ? (
                  <>
                    {cardStatus[activeModal]?.success && <span className="text-green-600">Saved successfully!</span>}
                    {cardStatus[activeModal]?.error && <span className="text-rose-600">{cardStatus[activeModal]?.error}</span>}
                  </>
                ) : (
                  saving && <span className="text-indigo-600">Saving all changes...</span>
                )}
              </div>
              
              <div className="flex gap-2.5">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-750 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (activeTab === 'general') {
                      await handleSaveAll();
                      setActiveModal(null);
                    } else if (activeTab === 'payments') {
                      if (activeModal === 'paymentHealthModal') {
                        setActiveModal(null);
                      } else {
                        await handleSavePaymentCard(activeModal);
                        // Don't auto close to let the user see the Success indicator, or close after timeout
                        setTimeout(() => setActiveModal(null), 1000);
                      }
                    } else if (activeTab === 'inventory') {
                      if (activeModal === 'inventoryHealthModal') {
                        setActiveModal(null);
                      } else {
                        await handleSaveInventoryCard(activeModal);
                        setTimeout(() => setActiveModal(null), 1000);
                      }
                    } else {
                      await handleSaveCard(activeModal);
                      // Don't auto close to let the user see the Success indicator, or close after timeout
                      setTimeout(() => setActiveModal(null), 1000);
                    }
                  }}
                  disabled={
                    saving || 
                    (activeTab === 'orders' && cardStatus[activeModal]?.loading) || 
                    (activeTab === 'payments' && cardStatus[activeModal]?.loading) || 
                    (activeTab === 'inventory' && cardStatus[activeModal]?.loading) || 
                    !isSuperAdmin
                  }
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs disabled:opacity-50 transition-colors shadow-sm shadow-indigo-600/10 cursor-pointer"
                >
                  {saving || 
                   (activeTab === 'orders' && cardStatus[activeModal]?.loading) || 
                   (activeTab === 'payments' && cardStatus[activeModal]?.loading) ||
                   (activeTab === 'inventory' && cardStatus[activeModal]?.loading)
                    ? 'Saving...' 
                    : (activeModal === 'paymentHealthModal' || activeModal === 'inventoryHealthModal') ? 'Close' : 'Save Settings'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
