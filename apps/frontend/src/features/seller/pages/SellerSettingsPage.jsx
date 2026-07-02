import React, { useState } from 'react';
import {
  Save, Bell, Wallet, Store, Lock, FileText,
  ShoppingBag, SlidersHorizontal, Hexagon,
  Building2, ChevronRight, Info, CheckCircle2,
  ArrowLeftRight, Shield, ExternalLink, MoreHorizontal,
  Power, Upload, MapPin, Tag, Check, Target,
  Eye, EyeOff, Monitor, Smartphone, Laptop, Clock,
  LogOut, HelpCircle, ShieldCheck, MoreVertical, CreditCard, Plus
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal.jsx';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { SellerShopProfilePage } from './SellerShopProfilePage.jsx';

/* ─────────────────── Shared Sub-components ─────────────────── */

const Toggle = ({ enabled, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    aria-pressed={enabled}
    className={`${
      enabled ? 'bg-[#16A34A]' : 'bg-gray-200'
    } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]`}
  >
    <span
      className={`${
        enabled ? 'translate-x-5' : 'translate-x-0'
      } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
    />
  </button>
);

const InputLabel = ({ children }) => (
  <label className="block text-xs font-bold text-gray-800 mb-2">{children}</label>
);

const SectionIcon = ({ Icon }) => (
  <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center shrink-0">
    <Icon size={16} strokeWidth={2.5} />
  </div>
);

const CardHeader = ({ number, icon: Icon, title, subtitle }) => (
  <div className="flex items-start gap-3 mb-6">
    <SectionIcon Icon={Icon} />
    <div>
      <h2 className="text-[15px] font-bold text-gray-900">{number}. {title}</h2>
      <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
    </div>
  </div>
);

/* ─────────────────── Tab Content: General ─────────────────── */
const GeneralTab = () => {
  const [enableStore, setEnableStore] = useState(true);
  const [allowReviews, setAllowReviews] = useState(true);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Order Settings */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 h-fit">
        <CardHeader number="1" icon={ShoppingBag} title="Order Settings" subtitle="Configure how your orders are managed." />
        <div className="flex flex-col gap-5">
          <div>
            <InputLabel>Order ID Prefix</InputLabel>
            <input type="text" defaultValue="CRV" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]" />
          </div>
          <div>
            <InputLabel>Auto Cancel Unpaid Orders</InputLabel>
            <select className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]">
              <option>After 24 Hours</option>
              <option>After 48 Hours</option>
              <option>After 72 Hours</option>
            </select>
          </div>
          <div>
            <InputLabel>Invoice Prefix</InputLabel>
            <input type="text" defaultValue="INV" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]" />
          </div>
        </div>
      </div>

      {/* Other Settings */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 h-fit">
        <CardHeader number="2" icon={SlidersHorizontal} title="Other Settings" subtitle="Additional preferences for your store." />
        <div className="flex flex-col gap-6">
          <div>
            <InputLabel>Low Stock Alert Threshold</InputLabel>
            <input type="text" defaultValue="10" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]" />
          </div>
          <div className="flex flex-col justify-start">
            <InputLabel>Enable Store</InputLabel>
            <div className="flex items-center gap-3 mt-1.5">
              <Toggle enabled={enableStore} onChange={() => setEnableStore(!enableStore)} />
              <span className="text-[12px] font-medium text-gray-500">Your store is visible to customers.</span>
            </div>
          </div>
          <div className="flex flex-col justify-start">
            <InputLabel>Allow Product Reviews</InputLabel>
            <div className="flex items-center gap-3 mt-1.5">
              <Toggle enabled={allowReviews} onChange={() => setAllowReviews(!allowReviews)} />
              <span className="text-[12px] font-medium text-gray-500">Customers can review products.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────── Tab Content: Notifications ─────────────────── */
const NotificationsTab = () => {
  const sections = [
    {
      icon: ShoppingBag,
      title: 'Order Notifications',
      desc: 'Get notified about important order updates.',
      items: [
        { label: 'New Order Received', desc: 'When a new order is placed' },
        { label: 'Order Cancelled', desc: 'When a customer cancels an order' },
        { label: 'Order Delivered', desc: 'When an order is marked as delivered' },
        { label: 'Payment Received', desc: 'When a payment is received' },
      ],
    },
    {
      icon: SlidersHorizontal,
      title: 'Inventory Alerts',
      desc: 'Stay informed about your stock levels.',
      items: [
        { label: 'Low Stock Alerts', desc: 'When stock falls below the threshold' },
        { label: 'Out Of Stock Alerts', desc: 'When a product is out of stock' },
      ],
    },
    {
      icon: Store,
      title: 'Product Notifications',
      desc: 'Updates related to your products and reviews.',
      items: [
        { label: 'Product Approved', desc: 'When a product is approved' },
        { label: 'Product Rejected', desc: 'When a product is rejected' },
        { label: 'Product Review Received', desc: 'When a new review is received' },
      ],
    },
    {
      icon: Wallet,
      title: 'Promotions & Ads',
      desc: 'Get updated about your campaigns and promotions.',
      items: [
        { label: 'Campaign Approved', desc: 'When your campaign is approved' },
        { label: 'Campaign Rejected', desc: 'When your campaign is rejected' },
        { label: 'Campaign Expiring Soon', desc: 'When a campaign is about to expire' },
      ],
    },
    {
      icon: ChevronRight,
      title: 'Delivery Updates',
      desc: 'Get notified about shipping and delivery updates.',
      items: [
        { label: 'Shipment Picked Up', desc: 'When shipment is picked up' },
        { label: 'Delivery Delayed', desc: 'When there is a delay in delivery' },
        { label: 'Delivery Completed', desc: 'When the order is delivered successfully' },
      ],
    },
    {
      icon: Bell,
      title: 'Notification Channels',
      desc: 'Select how you want to receive notifications.',
      items: [
        { label: 'In-App Notifications', desc: 'Receive notifications inside the app' },
        { label: 'Email Notifications', desc: 'Receive notifications on your email' },
      ],
    },
  ];

  const [checked, setChecked] = useState(() => {
    const init = {};
    sections.forEach(s => s.items.forEach(item => { init[item.label] = true; }));
    return init;
  });

  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 mb-4">Notification Settings</p>
      <p className="text-xs text-gray-500 mb-6">Choose the updates and alerts you want to receive.</p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {sections.map((section) => (
          <div key={section.title} className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <SectionIcon Icon={section.icon} />
              <div>
                <h3 className="text-[13px] font-bold text-gray-900">{section.title}</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">{section.desc}</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {section.items.map(item => (
                <label key={item.label} className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={checked[item.label] ?? true}
                    onChange={() => setChecked(prev => ({ ...prev, [item.label]: !prev[item.label] }))}
                    className="mt-0.5 w-4 h-4 accent-[#16A34A] cursor-pointer"
                  />
                  <div>
                    <p className="text-[12px] font-semibold text-gray-800">{item.label}</p>
                    <p className="text-[11px] text-gray-500">{item.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─────────────────── Tab Content: Payouts ─────────────────── */
const PayoutsTab = () => {
  const [payoutMethod, setPayoutMethod] = useState('bank');
  const [payoutSchedule, setPayoutSchedule] = useState('weekly');
  const [activeTabCard, setActiveTabCard] = useState(null);

  const [isEditingBank, setIsEditingBank] = useState(false);
  const [bankHolder, setBankHolder] = useState('Nouri Ahmad');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [bankAccountNum, setBankAccountNum] = useState('98765432104567');
  const [bankIfsc, setBankIfsc] = useState('HDFC0001234');

  const [tempHolder, setTempHolder] = useState('');
  const [tempName, setTempName] = useState('');
  const [tempAccount, setTempAccount] = useState('');
  const [tempIfsc, setTempIfsc] = useState('');

  const schedules = [
    { id: 'weekly', label: 'Weekly', sub: 'Every Monday' },
    { id: 'biweekly', label: 'Bi-Weekly', sub: 'Every 1st & 15th of the month' },
    { id: 'monthly', label: 'Monthly', sub: 'On the 1st of every month' },
  ];

  const verificationItems = [
    { icon: Building2, label: 'PAN Card', sub: 'Permanent Account Number', status: 'Verified' },
    { icon: Building2, label: 'Bank Account', sub: 'Bank account verification', status: 'Verified' },
    { icon: Building2, label: 'KYC Status', sub: 'Know Your Customer', status: 'Approved' },
    { icon: Building2, label: 'FSSAI License', sub: 'Food Safety and Standards Authority of India', status: 'Verified' },
  ];

  const handleCardClick = (cardName) => {
    setActiveTabCard(prev => prev === cardName ? null : cardName);
  };

  const startEditing = () => {
    setTempHolder(bankHolder);
    setTempName(bankName);
    setTempAccount(bankAccountNum);
    setTempIfsc(bankIfsc);
    setIsEditingBank(true);
  };

  const saveEditing = () => {
    setBankHolder(tempHolder);
    setBankName(tempName);
    setBankAccountNum(tempAccount);
    setBankIfsc(tempIfsc);
    setIsEditingBank(false);
    toast.success('Bank account details updated successfully!');
  };

  return (
    <section aria-labelledby="payouts-dashboard-title" className="flex flex-col gap-8">
      <h2 id="payouts-dashboard-title" className="sr-only">Payouts Dashboard</h2>
      
      {/* 2-row Grid of Small Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1 — Bank Account */}
        <article
          onClick={() => handleCardClick('bank')}
          className={`bg-white border rounded-xl shadow-sm p-6 cursor-pointer transition-all duration-200 motion-reduce:transition-none flex items-center justify-between group ${
            activeTabCard === 'bank'
              ? 'border-[#16A34A] ring-1 ring-[#16A34A] bg-[#F0FDF4]/30'
              : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Building2 size={20} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-gray-900 group-hover:text-[#16A34A] transition-colors duration-200">1. Bank Account</h3>
              <p className="text-[11px] text-gray-500 mt-2">View and update your receiving bank account details.</p>
            </div>
          </div>
          <ChevronRight size={16} className={`text-gray-400 group-hover:text-[#16A34A] group-hover:translate-x-1 transition-all duration-200 motion-reduce:transition-none shrink-0 ${activeTabCard === 'bank' ? 'text-[#16A34A] translate-x-1' : ''}`} />
        </article>

        {/* Card 2 — Payout Summary */}
        <article
          onClick={() => handleCardClick('summary')}
          className={`bg-white border rounded-xl shadow-sm p-6 cursor-pointer transition-all duration-200 motion-reduce:transition-none flex items-center justify-between group ${
            activeTabCard === 'summary'
              ? 'border-[#16A34A] ring-1 ring-[#16A34A] bg-[#F0FDF4]/30'
              : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Wallet size={20} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-gray-900 group-hover:text-[#16A34A] transition-colors duration-200">2. Payout Summary</h3>
              <p className="text-[11px] text-gray-500 mt-2">Overview of available, pending balances and last payouts.</p>
            </div>
          </div>
          <ChevronRight size={16} className={`text-gray-400 group-hover:text-[#16A34A] group-hover:translate-x-1 transition-all duration-200 motion-reduce:transition-none shrink-0 ${activeTabCard === 'summary' ? 'text-[#16A34A] translate-x-1' : ''}`} />
        </article>

        {/* Card 3 — Payout Preferences */}
        <article
          onClick={() => handleCardClick('preferences')}
          className={`bg-white border rounded-xl shadow-sm p-6 cursor-pointer transition-all duration-200 motion-reduce:transition-none flex items-center justify-between group ${
            activeTabCard === 'preferences'
              ? 'border-[#16A34A] ring-1 ring-[#16A34A] bg-[#F0FDF4]/30'
              : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ArrowLeftRight size={20} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-gray-900 group-hover:text-[#16A34A] transition-colors duration-200">3. Payout Preferences</h3>
              <p className="text-[11px] text-gray-500 mt-2">Set up preferred payout methods and recurring schedules.</p>
            </div>
          </div>
          <ChevronRight size={16} className={`text-gray-400 group-hover:text-[#16A34A] group-hover:translate-x-1 transition-all duration-200 motion-reduce:transition-none shrink-0 ${activeTabCard === 'preferences' ? 'text-[#16A34A] translate-x-1' : ''}`} />
        </article>

        {/* Card 4 — Verification Status */}
        <article
          onClick={() => handleCardClick('verification')}
          className={`bg-white border rounded-xl shadow-sm p-6 cursor-pointer transition-all duration-200 motion-reduce:transition-none flex items-center justify-between group ${
            activeTabCard === 'verification'
              ? 'border-[#16A34A] ring-1 ring-[#16A34A] bg-[#F0FDF4]/30'
              : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Shield size={20} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-gray-900 group-hover:text-[#16A34A] transition-colors duration-200">4. Verification Status</h3>
              <p className="text-[11px] text-gray-500 mt-2">Check compliance status for PAN, Bank, KYC, and FSSAI.</p>
            </div>
          </div>
          <ChevronRight size={16} className={`text-gray-400 group-hover:text-[#16A34A] group-hover:translate-x-1 transition-all duration-200 motion-reduce:transition-none shrink-0 ${activeTabCard === 'verification' ? 'text-[#16A34A] translate-x-1' : ''}`} />
        </article>
      </div>

      {/* Modal Detailed View Popup */}
      <Modal
        isOpen={activeTabCard !== null}
        onClose={() => {
          setActiveTabCard(null);
          setIsEditingBank(false);
        }}
        title={
          activeTabCard === 'bank'
            ? (isEditingBank ? 'Edit Bank Account' : 'Bank Account Details')
            : activeTabCard === 'summary'
            ? 'Payout Summary'
            : activeTabCard === 'preferences'
            ? 'Payout Preferences'
            : activeTabCard === 'verification'
            ? 'Verification Status'
            : ''
        }
      >
        {activeTabCard === 'bank' && (
          isEditingBank ? (
            <form onSubmit={(e) => { e.preventDefault(); saveEditing(); }} className="flex flex-col gap-6">
              <p className="text-xs text-gray-500 mb-2">Update your receiving bank account credentials.</p>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-2">ACCOUNT HOLDER NAME</label>
                  <input
                    type="text"
                    required
                    value={tempHolder}
                    onChange={(e) => setTempHolder(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-2">BANK NAME</label>
                  <input
                    type="text"
                    required
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-2">ACCOUNT NUMBER</label>
                  <input
                    type="text"
                    required
                    value={tempAccount}
                    onChange={(e) => setTempAccount(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-2">IFSC CODE</label>
                  <input
                    type="text"
                    required
                    value={tempIfsc}
                    onChange={(e) => setTempIfsc(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#16A34A] text-white rounded-lg text-[13px] font-semibold hover:bg-[#148F40] transition-colors"
                >
                  Save Details
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingBank(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-[13px] font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-6">
              <p className="text-xs text-gray-500 mb-2">This is where your earnings will be transferred.</p>
              <ul className="flex flex-col divide-y divide-gray-100">
                {[
                  { label: 'Account Holder Name', value: bankHolder },
                  { label: 'Bank Name', value: bankName },
                  { label: 'Account Number', value: '**** **** **** ' + bankAccountNum.slice(-4) },
                  { label: 'IFSC Code', value: bankIfsc },
                ].map(row => (
                  <li key={row.label} className="flex items-center justify-between py-4">
                    <span className="text-[13px] text-gray-500 font-medium">{row.label}</span>
                    <span className="text-[13px] font-semibold text-gray-800">{row.value}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={startEditing}
                className="w-fit mt-4 flex items-center justify-center gap-2 px-4 py-2 border border-[#16A34A] text-[#16A34A] rounded-lg text-[13px] font-semibold hover:bg-[#F0FDF4] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Update Bank Account
              </button>
            </div>
          )
        )}

        {activeTabCard === 'summary' && (
          <div className="flex flex-col gap-6">
            <p className="text-xs text-gray-500 mb-2">Overview of your balances and payouts.</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col gap-2">
                <span className="text-[11px] text-gray-500 font-medium leading-tight">Available Balance</span>
                <span className="text-[17px] font-bold text-[#16A34A] leading-tight">₹12,450.00</span>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col gap-2">
                <span className="text-[11px] text-gray-500 font-medium leading-tight">Pending Balance</span>
                <span className="text-[17px] font-bold text-orange-500 leading-tight">₹3,200.00</span>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col gap-2">
                <span className="text-[11px] text-gray-500 font-medium leading-tight">Total Withdrawn</span>
                <span className="text-[17px] font-bold text-gray-800 leading-tight">₹85,600.00</span>
              </div>
            </div>
            <div className="border border-gray-100 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center shrink-0">
                  <Building2 size={16} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-gray-800">Last Payout</p>
                  <p className="text-[11px] text-gray-500">18 Jun 2026</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold text-gray-800">₹5,000.00</span>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </div>
          </div>
        )}

        {activeTabCard === 'preferences' && (
          <div className="flex flex-col gap-6">
            <p className="text-xs text-gray-500 mb-2">Choose how and when you want to receive payouts.</p>

            <div>
              <h4 className="text-[12px] font-bold text-gray-700 mb-4">Payout Method</h4>
              <label
                className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer mb-6 transition-colors ${
                  payoutMethod === 'bank'
                    ? 'border-[#16A34A] bg-[#F0FDF4]/60'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="payoutMethod"
                  value="bank"
                  checked={payoutMethod === 'bank'}
                  onChange={() => setPayoutMethod('bank')}
                  className="mt-1 accent-[#16A34A]"
                />
                <div>
                  <span className="block text-[13px] font-bold text-gray-800">Bank Transfer</span>
                  <span className="block text-[11px] text-gray-500">Earnings will be transferred to your bank account</span>
                </div>
              </label>
            </div>

            <div>
              <h4 className="text-[12px] font-bold text-gray-700 mb-4">Payout Schedule</h4>
              <div className="flex flex-col gap-4">
                {schedules.map(s => (
                  <label key={s.id} className="flex items-start gap-4 cursor-pointer">
                    <input
                      type="radio"
                      name="payoutSchedule"
                      value={s.id}
                      checked={payoutSchedule === s.id}
                      onChange={() => setPayoutSchedule(s.id)}
                      className="mt-1 accent-[#16A34A]"
                    />
                    <div>
                      <span className={`block text-[13px] font-bold ${payoutSchedule === s.id ? 'text-gray-900' : 'text-gray-600'}`}>{s.label}</span>
                      <span className="block text-[11px] text-gray-500">{s.sub}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTabCard === 'verification' && (
          <div className="flex flex-col gap-6">
            <p className="text-xs text-gray-500 mb-2">Your verification and compliance status.</p>
            <ul className="flex flex-col divide-y divide-gray-100 mb-4">
              {verificationItems.map(item => (
                <li key={item.label} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 text-gray-400 flex items-center justify-center shrink-0">
                      <item.icon size={15} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-gray-800">{item.label}</p>
                      <p className="text-[11px] text-gray-500">{item.sub}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[#16A34A]">
                    <CheckCircle2 size={15} className="fill-[#16A34A] text-white" />
                    <span className="text-[12px] font-bold">{item.status}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex items-start gap-4 bg-blue-50 border border-blue-100 rounded-lg p-4">
              <Info size={15} className="text-blue-500 shrink-0 mt-1" />
              <div>
                <p className="text-[12px] font-semibold text-blue-700">All your documents are verified.</p>
                <p className="text-[11px] text-blue-600">You're all set to receive payouts.</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
};


/* ─────────────────── Tab Content: Store Profile ─────────────────── */
const DefaultLogo = () => (
  <svg className="w-full h-full object-cover bg-amber-50" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="50" fill="#E8D8C8"/>
    <circle cx="50" cy="50" r="45" stroke="#D3B89E" strokeWidth="1" strokeDasharray="3 3"/>
    <path d="M35 65 L48 52 M48 52 L40 52 M48 52 L48 60" stroke="#7A1C5A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M45 55 L65 35 M65 35 L53 35 M65 35 L65 47" stroke="#7A1C5A" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M35 50 L50 35 M50 35 L42 35 M50 35 L50 43" stroke="#7A1C5A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DefaultBanner = () => (
  <svg className="w-full h-full bg-white border border-gray-100" viewBox="0 0 400 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(15, 20) scale(0.6)">
      <circle cx="50" cy="50" r="50" fill="#E8D8C8"/>
      <path d="M35 65 L48 52 M48 52 L40 52 M48 52 L48 60" stroke="#7A1C5A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M45 55 L65 35 M65 35 L53 35 M65 35 L65 47" stroke="#7A1C5A" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M35 50 L50 35 M50 35 L42 35 M50 35 L50 43" stroke="#7A1C5A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </g>
    <text x="90" y="62" fill="#2E0E3B" fontFamily="Inter, Roboto, sans-serif" fontSize="28" fontWeight="800" letterSpacing="1">aametta</text>
  </svg>
);

const StoreProfileTab = ({ onSave }) => {
  const [shopName, setShopName] = useState('Aametta Foods');
  const [shopType, setShopType] = useState('Local Shop');
  const [businessModel, setBusinessModel] = useState('Self-Operated');
  const [shopDescription, setShopDescription] = useState('Healthy food, better lifestyle.');
  const [isActive, setIsActive] = useState(true);
  
  const [locationName, setLocationName] = useState('Aametta Foods Outlet');
  const [pickupPhone, setPickupPhone] = useState('9876543210');
  const [streetAddress, setStreetAddress] = useState('12/1 Green Valley Road');
  const [city, setCity] = useState('Kochi');
  const [state, setState] = useState('Kerala');
  const [pincode, setPincode] = useState('682001');

  const [enableSelfPickup, setEnableSelfPickup] = useState(true);
  const [enableHomeDelivery, setEnableHomeDelivery] = useState(true);
  const [deliveryRadius, setDeliveryRadius] = useState('5 KM');

  const [logoImage, setLogoImage] = useState(null);
  const [bannerImage, setBannerImage] = useState(null);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoImage(event.target.result);
        toast.success("Logo uploaded successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setBannerImage(event.target.result);
        toast.success("Banner uploaded successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e) => {
    if (e) e.preventDefault();
    toast.success('Shop profile updated successfully!');
    if (onSave) onSave();
  };

  const toggleStatus = () => {
    setIsActive(!isActive);
    toast.success(isActive ? 'Shop deactivated successfully!' : 'Shop activated successfully!');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Card - Store Summary Header */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full border border-gray-100 overflow-hidden shrink-0 shadow-sm">
            {logoImage ? (
              <img src={logoImage} alt="Shop Logo" className="w-full h-full object-cover" />
            ) : (
              <DefaultLogo />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900 leading-tight">{shopName}</h2>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : 'bg-gray-50 text-gray-400 border-gray-200'
              }`}>
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
              <div className="flex items-center gap-1 text-[11px] font-medium text-gray-400">
                <Store size={12} className="text-gray-400" />
                <span>{shopType}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-medium text-gray-400">
                <MapPin size={12} className="text-gray-400" />
                <span>{city}, {state}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-medium text-gray-400">
                <Tag size={12} className="text-gray-400" />
                <span>Shop ID: CRV-1256</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 self-stretch sm:self-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toast.info('Opening shop preview...')}
              className="flex items-center gap-2 px-3 py-1.5 border border-[#16A34A] text-[#16A34A] rounded-lg text-xs font-bold hover:bg-[#F0FDF4] transition-colors"
            >
              <ExternalLink size={14} /> Preview Store
            </button>
            <button type="button" className="p-1.5 border border-gray-200 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
              <MoreHorizontal size={14} />
            </button>
          </div>
          <button
            type="button"
            onClick={toggleStatus}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-bold transition-colors ${
              isActive
                ? 'border-red-200 text-red-500 hover:bg-red-50'
                : 'border-[#16A34A]/20 text-[#16A34A] hover:bg-[#F0FDF4]'
            }`}
          >
            <Power size={14} /> {isActive ? 'Deactivate Store' : 'Activate Store'}
          </button>
        </div>
      </section>

      {/* Main 2-column content grid */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Shop Info & Pickup Location */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Card A: Shop Information */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 flex flex-col gap-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center shrink-0">
                <Store size={16} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-gray-900">Shop Information</h3>
                <p className="text-xs text-gray-500 mt-0.5">Basic information about your shop.</p>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div>
                <InputLabel>Shop Name</InputLabel>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <InputLabel>Shop Type</InputLabel>
                  <select
                    value={shopType}
                    onChange={(e) => setShopType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
                  >
                    <option>Local Shop</option>
                    <option>Online Store</option>
                    <option>Home Kitchen</option>
                    <option>Boutique</option>
                  </select>
                </div>
                <div>
                  <InputLabel>Business Model</InputLabel>
                  <select
                    value={businessModel}
                    onChange={(e) => setBusinessModel(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
                  >
                    <option>Self-Operated</option>
                    <option>Franchise</option>
                    <option>Consignment</option>
                    <option>Managed by Cravo</option>
                  </select>
                </div>
              </div>

              <div className="relative">
                <InputLabel>Shop Description</InputLabel>
                <textarea
                  rows={4}
                  maxLength={500}
                  value={shopDescription}
                  onChange={(e) => setShopDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A] resize-none"
                />
                <span className="absolute bottom-3 right-3 text-[10px] text-gray-400 font-semibold">
                  {shopDescription.length}/500
                </span>
              </div>
            </div>
          </div>

          {/* Card B: Pickup Location */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 flex flex-col gap-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center shrink-0">
                <MapPin size={16} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-gray-900">Pickup Location</h3>
                <p className="text-xs text-gray-500 mt-0.5">Where customers will pick up their orders.</p>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <InputLabel>Location Name / Shop Name</InputLabel>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
                  />
                </div>
                <div>
                  <InputLabel>Pickup Contact Phone</InputLabel>
                  <input
                    type="text"
                    value={pickupPhone}
                    onChange={(e) => setPickupPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
                  />
                </div>
              </div>

              <div>
                <InputLabel>Street Address</InputLabel>
                <input
                  type="text"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <InputLabel>City</InputLabel>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
                  />
                </div>
                <div>
                  <InputLabel>State</InputLabel>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
                  />
                </div>
              </div>

              <div className="w-1/2 pr-2">
                <InputLabel>Pincode</InputLabel>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
                />
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100 pt-6" />

              {/* Fulfillment Options */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center shrink-0">
                    <ShoppingBag size={16} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-[15px] font-bold text-gray-900">Fulfillment Options</h3>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 mt-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={enableSelfPickup}
                        onChange={() => setEnableSelfPickup(!enableSelfPickup)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        enableSelfPickup
                          ? 'bg-[#16A34A] border-[#16A34A] text-white shadow-sm shadow-[#16A34A]/25'
                          : 'bg-white border-gray-300 group-hover:border-gray-400'
                      }`}>
                        {enableSelfPickup && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-800">Enable Self Pickup</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={enableHomeDelivery}
                        onChange={() => setEnableHomeDelivery(!enableHomeDelivery)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        enableHomeDelivery
                          ? 'bg-[#16A34A] border-[#16A34A] text-white shadow-sm shadow-[#16A34A]/25'
                          : 'bg-white border-gray-300 group-hover:border-gray-400'
                      }`}>
                        {enableHomeDelivery && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-800">Enable Home Delivery</span>
                  </label>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100 pt-6" />

              {/* Delivery Radius */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center shrink-0">
                    <Target size={16} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-[15px] font-bold text-gray-900">Delivery Radius</h3>
                </div>
                <select
                  value={deliveryRadius}
                  onChange={(e) => setDeliveryRadius(e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A] w-28 text-center"
                >
                  <option>1 KM</option>
                  <option>2 KM</option>
                  <option>5 KM</option>
                  <option>10 KM</option>
                  <option>20 KM</option>
                </select>
              </div>

            </div>
          </div>
        </div>

        {/* Right Column: Branding, Status */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Card C: Branding */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 flex flex-col gap-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center shrink-0">
                <Camera size={16} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-gray-900">Branding</h3>
                <p className="text-xs text-gray-500 mt-0.5">Shop branding and media assets.</p>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {/* Logo */}
              <div>
                <InputLabel>Shop Logo</InputLabel>
                <div className="flex items-center gap-4 mt-2">
                  <div className="w-16 h-16 rounded-full border border-gray-150 overflow-hidden shrink-0 shadow-sm">
                    {logoImage ? (
                      <img src={logoImage} alt="Shop Logo" className="w-full h-full object-cover" />
                    ) : (
                      <DefaultLogo />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-[12px] font-bold hover:bg-gray-50 transition-colors cursor-pointer w-fit">
                      <Upload size={14} />
                      Upload Logo
                      <input type="file" accept="image/*" className="sr-only" onChange={handleLogoUpload} />
                    </label>
                    <span className="text-[10px] text-gray-400 font-semibold">Recommended: 500x500px JPG, PNG up to 2MB</span>
                  </div>
                </div>
              </div>

              {/* Banner */}
              <div>
                <InputLabel>Shop Banner</InputLabel>
                <div className="flex items-center gap-4 mt-2">
                  <div className="w-[140px] h-[56px] rounded-lg overflow-hidden border border-gray-150 flex items-center justify-center shrink-0 shadow-sm">
                    {bannerImage ? (
                      <img src={bannerImage} alt="Shop Banner" className="w-full h-full object-cover" />
                    ) : (
                      <DefaultBanner />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-[12px] font-bold hover:bg-gray-50 transition-colors cursor-pointer w-fit">
                      <Upload size={14} />
                      Upload Banner
                      <input type="file" accept="image/*" className="sr-only" onChange={handleBannerUpload} />
                    </label>
                    <span className="text-[10px] text-gray-400 font-semibold">Recommended: 1200x300px JPG, PNG up to 2MB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card D: Store Status */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center shrink-0">
                  <Shield size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900">Store Status</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isActive ? 'Your shop is currently active.' : 'Your shop is currently inactive.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Toggle enabled={isActive} onChange={toggleStatus} />
                <span className={`text-xs font-bold ${isActive ? 'text-[#16A34A]' : 'text-gray-400'}`}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Local Save Changes Button */}
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-3 bg-[#1E3A2B] text-white text-[13px] font-bold rounded-xl shadow-xl hover:bg-[#162A1F] transition-colors"
            >
              <Save size={16} />
              Save Changes
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

/* ─────────────────── Tab Content: Security ─────────────────── */
const SecurityTab = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [sessions, setSessions] = useState([
    { id: 1, type: 'current', device: 'Current Device', os: 'Windows • Chrome', active: 'Just now', badge: 'This Device' },
    { id: 2, type: 'mobile', device: 'Mobile Device', os: 'Android • Chrome', active: '2 hours ago' },
    { id: 3, type: 'laptop', device: 'Laptop', os: 'Windows • Edge', active: '1 day ago' },
  ]);

  const [is2faEnabled, setIs2faEnabled] = useState(false);

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All password fields are required');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }
    toast.success('Password updated successfully!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleLogoutOthers = () => {
    setSessions(prev => prev.filter(s => s.type === 'current'));
    toast.success('Successfully logged out of all other devices');
  };

  const toggle2fa = () => {
    setIs2faEnabled(prev => !prev);
    toast.success(is2faEnabled ? '2FA disabled successfully' : '2FA enabled successfully!');
  };

  const recentLogins = [
    { time: 'Today, 10:24 AM', location: 'Kochi, Kerala, India', device: 'Windows • Chrome', ip: '103.21.244.XX' },
    { time: 'Yesterday, 8:15 PM', location: 'Bangalore, Karnataka, India', device: 'Android • Chrome', ip: '103.45.67.XX' },
    { time: 'May 16, 2025, 6:30 PM', location: 'Kochi, Kerala, India', device: 'Windows • Edge', ip: '103.21.244.XX' },
    { time: 'May 15, 2025, 11:02 AM', location: 'Kochi, Kerala, India', device: 'Android • Chrome', ip: '103.21.244.XX' },
    { time: 'May 14, 2025, 9:40 AM', location: 'Kochi, Kerala, India', device: 'Windows • Chrome', ip: '103.21.244.XX' },
  ];

  return (
    <div className="space-y-8">
      {/* Top Grid Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Card 1: Change Password */}
        <section className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 flex flex-col gap-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-50 text-[#16A34A] flex items-center justify-center shrink-0">
              <Lock size={16} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">1. Change Password</h3>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">Update your password regularly to keep your account secure.</p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
            <div>
              <InputLabel>Current Password</InputLabel>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="Enter your current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <InputLabel>New Password</InputLabel>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <InputLabel>Confirm New Password</InputLabel>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Hint Alert */}
            <div className="bg-green-50/50 border border-green-100 rounded-lg p-3 flex items-start gap-2.5 mt-2">
              <CheckCircle2 size={15} className="text-[#16A34A] shrink-0 mt-0.5" />
              <p className="text-xs text-green-700 font-medium leading-normal">
                Use a strong password with at least 8 characters, including numbers and symbols.
              </p>
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2.5 bg-[#16A34A] text-white text-[13px] font-bold rounded-lg hover:bg-[#148F40] transition-colors mt-2 w-fit shadow-md shadow-green-100/50 cursor-pointer"
            >
              <Lock size={14} /> Update Password
            </button>
          </form>
        </section>

        {/* Card 2: Active Sessions */}
        <section className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 flex flex-col gap-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-50 text-[#16A34A] flex items-center justify-center shrink-0">
              <Monitor size={16} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">2. Active Sessions</h3>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">Manage devices where your account is currently signed in.</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {sessions.map(s => (
              <div
                key={s.id}
                className={`rounded-xl p-4 flex items-center justify-between border transition-all duration-200 ${
                  s.type === 'current'
                    ? 'border-green-200 bg-green-50/20'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    s.type === 'current'
                      ? 'bg-green-100 text-green-600'
                      : s.type === 'mobile'
                      ? 'bg-blue-50 text-blue-500'
                      : 'bg-purple-50 text-purple-500'
                  }`}>
                    {s.type === 'mobile' ? (
                      <Smartphone size={18} />
                    ) : s.type === 'laptop' ? (
                      <Laptop size={18} />
                    ) : (
                      <Monitor size={18} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-gray-800">{s.device}</span>
                      {s.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-green-100 text-green-700 tracking-wider">
                          {s.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">{s.os}</p>
                    <p className="text-[10px] text-gray-400 font-medium">Last active: {s.active}</p>
                  </div>
                </div>
                {s.type !== 'current' && (
                  <button type="button" className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                    <MoreVertical size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-auto">
            {sessions.length > 1 ? (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleLogoutOthers}
                  className="w-fit flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut size={14} /> Logout Other Devices
                </button>
                <p className="text-[10px] text-gray-400 font-medium">This will sign you out from all devices except this one.</p>
              </div>
            ) : (
              <p className="text-xs text-gray-400 font-semibold bg-gray-50 border border-gray-100 rounded-lg p-3 text-center">
                You are currently not signed in on any other devices.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Bottom Grid Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Card 3: Two-Factor Authentication (2FA) */}
        <section className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 flex flex-col gap-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-50 text-[#16A34A] flex items-center justify-center shrink-0">
              <ShieldCheck size={16} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">3. Two-Factor Authentication (2FA)</h3>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">Add an extra layer of security to your account.</p>
            </div>
          </div>

          <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 shadow-sm shrink-0">
              <Shield size={28} className={is2faEnabled ? "text-[#16A34A]" : "text-gray-300"} />
            </div>
            <div className="text-center sm:text-left">
              <h4 className="text-[14px] font-bold text-gray-800">
                2FA is currently {is2faEnabled ? 'enabled' : 'disabled'}
              </h4>
              <p className="text-xs text-gray-500 mt-1 max-w-sm leading-relaxed font-medium">
                {is2faEnabled 
                  ? 'Your account is secured with two-factor authentication. Verification codes will be required upon log in.'
                  : 'Enable two-factor authentication to protect your account from unauthorized access.'
                }
              </p>
              <button
                type="button"
                onClick={toggle2fa}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-xs font-bold transition-all mt-4 w-fit mx-auto sm:mx-0 cursor-pointer ${
                  is2faEnabled
                    ? 'border-red-200 text-red-500 hover:bg-red-50'
                    : 'border-[#16A34A] text-[#16A34A] hover:bg-[#F0FDF4]'
                }`}
              >
                <ShieldCheck size={14} /> {is2faEnabled ? 'Disable 2FA' : 'Enable 2FA'}
              </button>
            </div>
          </div>
        </section>

        {/* Card 4: Recent Login Activity */}
        <section className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 flex flex-col gap-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-50 text-[#16A34A] flex items-center justify-center shrink-0">
              <Clock size={16} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">4. Recent Login Activity</h3>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">Review your recent account login activity.</p>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider text-left py-3 px-4">Date & Time</th>
                  <th className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider text-left py-3 px-4">Location</th>
                  <th className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider text-left py-3 px-4">Device</th>
                  <th className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider text-left py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentLogins.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="text-[11px] font-semibold text-gray-700 py-3 px-4 whitespace-nowrap">{row.time}</td>
                    <td className="text-[11px] font-semibold text-gray-700 py-3 px-4 whitespace-nowrap">{row.location}</td>
                    <td className="text-[11px] font-semibold text-gray-600 py-3 px-4 whitespace-nowrap">{row.device}</td>
                    <td className="text-[11px] font-semibold text-gray-400 py-3 px-4 whitespace-nowrap font-mono">{row.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Footer Support Banner */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
            <HelpCircle size={16} />
          </div>
          <p className="text-xs text-gray-500 font-medium">
            Need help? Contact our <a href="#" className="text-green-600 font-bold hover:underline">support team</a> for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────── Tab Content: Billing ─────────────────── */
const BillingTab = () => {
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const handleOpenModal = () => {
    setCardholderName('');
    setCardNumber('');
    setExpiry('');
    setCvv('');
    setIsModalOpen(true);
  };

  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    const formattedValue = value.replace(/(\d{4})(?=\d)/g, '$1 ').substring(0, 19);
    setCardNumber(formattedValue);
  };

  const handleExpiryChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    let formattedValue = value;
    if (value.length > 2) {
      formattedValue = `${value.slice(0, 2)}/${value.slice(2, 4)}`;
    }
    setExpiry(formattedValue.substring(0, 5));
  };

  const handleCvvChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setCvv(value.substring(0, 4));
  };

  const handleAddPayment = (e) => {
    e.preventDefault();
    if (!cardholderName || cardNumber.length < 19 || expiry.length < 5 || cvv.length < 3) {
      toast.error('Please enter valid card details');
      return;
    }

    // Detect card brand (simplified)
    const brand = cardNumber.startsWith('4') ? 'Visa' : cardNumber.startsWith('5') ? 'Mastercard' : 'Card';

    setPaymentMethod({
      brand,
      last4: cardNumber.slice(-4),
      cardholder: cardholderName,
      expiry,
    });

    setIsModalOpen(false);
    toast.success('Payment method added successfully!');
  };

  const handleRemovePayment = () => {
    setPaymentMethod(null);
    toast.success('Payment method removed successfully.');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Billing Overview Card */}
      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 h-fit flex flex-col gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center shrink-0">
            <FileText size={24} strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-[16px] font-bold text-gray-900 leading-tight">Billing Overview</h2>
            <p className="text-xs text-gray-500 mt-2 font-medium">Your billing and subscription details</p>
          </div>
        </div>

        <ul className="flex flex-col divide-y divide-gray-100 mt-2">
          <li className="flex items-center justify-between py-4">
            <span className="text-[13px] text-gray-500 font-medium">Billing Status</span>
            <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#15803D]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></span>
              Active
            </span>
          </li>
          <li className="flex items-center justify-between py-4">
            <span className="text-[13px] text-gray-500 font-medium">Current Plan</span>
            <span className="text-[13px] font-bold text-gray-900">Seller Plan</span>
          </li>
          <li className="flex items-center justify-between py-4">
            <span className="text-[13px] text-gray-500 font-medium">Next Billing Date</span>
            <span className="text-[13px] text-gray-400 font-medium">--</span>
          </li>
          <li className="flex items-center justify-between py-4">
            <span className="text-[13px] text-gray-500 font-medium">Payment Method</span>
            {paymentMethod ? (
              <span className="text-[13px] font-semibold text-gray-800">
                {paymentMethod.brand} ending in {paymentMethod.last4}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#B45309]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]"></span>
                Not Added
              </span>
            )}
          </li>
        </ul>

        <div className="border-t border-gray-100 pt-6 mt-2">
          <button
            type="button"
            onClick={() => toast.info('Navigating to billing history...')}
            className="w-full flex items-center justify-between text-sm font-bold text-[#16A34A] hover:text-[#148F40] transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <FileText size={16} />
              <span>View billing history</span>
            </div>
            <ChevronRight size={16} className="text-gray-400 group-hover:translate-x-0.5 transition-transform motion-reduce:transition-none" />
          </button>
        </div>
      </section>

      {/* Payment Method Card */}
      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 h-fit flex flex-col gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center shrink-0">
            <CreditCard size={24} strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-[16px] font-bold text-gray-900 leading-tight">Payment Method</h2>
            <p className="text-xs text-gray-500 mt-2 font-medium">Add or manage your payment methods</p>
          </div>
        </div>

        {paymentMethod ? (
          /* Active Payment Method Visual */
          <div className="flex flex-col gap-6 mt-2">
            <div className="relative w-full aspect-[1.586/1] max-w-[340px] mx-auto bg-gradient-to-br from-[#1E3A2B] to-[#16A34A] rounded-2xl p-6 text-white shadow-lg flex flex-col justify-between overflow-hidden">
              {/* Card Chip visual and brand */}
              <div className="flex items-start justify-between">
                {/* Chip */}
                <div className="w-10 h-8 rounded bg-white/20 relative flex items-center justify-center">
                  <div className="w-6 h-5 rounded border border-white/20"></div>
                </div>
                {/* Brand name */}
                <span className="text-[16px] font-extrabold italic tracking-wider">
                  {paymentMethod.brand.toUpperCase()}
                </span>
              </div>

              {/* Card Number */}
              <div className="text-[18px] font-bold tracking-widest my-4">
                •••• •••• •••• {paymentMethod.last4}
              </div>

              {/* Cardholder & Expiry */}
              <div className="flex items-end justify-between">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider text-white/60 font-semibold">Cardholder</span>
                  <span className="text-[13px] font-semibold tracking-wide truncate max-w-[180px]">
                    {paymentMethod.cardholder}
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[9px] uppercase tracking-wider text-white/60 font-semibold">Expires</span>
                  <span className="text-[13px] font-semibold tracking-wide">
                    {paymentMethod.expiry}
                  </span>
                </div>
              </div>

              {/* Decorative Card Logo Overlay */}
              <div className="absolute right-0 bottom-0 w-24 h-24 rounded-full bg-white/5 -mr-4 -mb-4 pointer-events-none"></div>
            </div>

            <div className="flex justify-center gap-4 mt-2">
              <button
                type="button"
                onClick={handleRemovePayment}
                className="px-5 py-2.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Remove Card
              </button>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-10 text-center">
            {/* Circular Dotted Visual */}
            <div className="w-20 h-20 rounded-full border border-dashed border-gray-300 bg-gray-50/50 flex items-center justify-center relative">
              <CreditCard size={28} className="text-gray-400" />
              <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center text-[#16A34A]">
                <Plus size={14} strokeWidth={2.5} />
              </div>
            </div>

            <h3 className="text-sm font-bold text-gray-900 mt-6">No payment method added yet</h3>
            <p className="text-xs text-gray-500 mt-2 max-w-[280px] leading-relaxed font-medium">
              Add a payment method to manage your billing and subscription.
            </p>

            <button
              type="button"
              onClick={handleOpenModal}
              className="mt-6 px-6 py-2.5 border border-[#16A34A] text-[#16A34A] bg-white rounded-lg text-xs font-bold hover:bg-[#F0FDF4] transition-colors cursor-pointer"
            >
              + Add Payment Method
            </button>
          </div>
        )}

        {/* Modal for adding payment method */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Add Payment Method"
        >
          <form onSubmit={handleAddPayment} className="flex flex-col gap-6">
            <p className="text-xs text-gray-500 mb-2">Enter your credit or debit card details below.</p>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-2">CARDHOLDER NAME</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nouri Ahmad"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-2">CARD NUMBER</label>
                <input
                  type="text"
                  required
                  placeholder="0000 0000 0000 0000"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-2">EXPIRY DATE</label>
                  <input
                    type="text"
                    required
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={handleExpiryChange}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-2">CVC / CVV</label>
                  <input
                    type="password"
                    required
                    placeholder="•••"
                    value={cvv}
                    onChange={handleCvvChange}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#16A34A] text-white rounded-lg text-[13px] font-semibold hover:bg-[#148F40] transition-colors cursor-pointer"
              >
                Save Card
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-[13px] font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      </section>
    </div>
  );
};

/* ─────────────────── Main Page ─────────────────── */
const TABS = [
  { id: 'general', name: 'General', icon: Hexagon },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'payouts', name: 'Payouts', icon: Wallet },
  { id: 'store-profile', name: 'Store Profile', icon: Store },
  { id: 'security', name: 'Security', icon: Lock },
  { id: 'billing', name: 'Billing', icon: FileText },
];

export const SellerSettingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState(
    tabParam && TABS.some(t => t.id === tabParam) ? tabParam : 'payouts'
  );

  React.useEffect(() => {
    if (tabParam && TABS.some(t => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'general': return <GeneralTab />;
      case 'notifications': return <NotificationsTab />;
      case 'payouts': return <PayoutsTab />;
      case 'store-profile': return <SellerShopProfilePage hideHeader={true} />;
      case 'security': return <SecurityTab />;
      case 'billing': return <BillingTab />;
      default:
        return (
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-12 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300">
              <FileText size={24} />
            </div>
            <p className="text-[14px] font-semibold text-gray-500">Coming soon</p>
            <p className="text-[12px] text-gray-400">This section is under construction.</p>
          </div>
        );
    }
  };

  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'store-profile':
        return {
          title: 'Shop Profile',
          subtitle: 'Manage your shop information and settings.',
        };
      default:
        return {
          title: 'Settings',
          subtitle: 'Manage your account preferences and configurations.',
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="max-w-[1200px] mx-auto pb-24 space-y-6">
      {/* Page Header */}
      <header>
        <h1 className="text-2xl font-bold text-gray-900">{headerInfo.title}</h1>
        <p className="text-sm text-gray-500 mt-1">{headerInfo.subtitle}</p>
      </header>

      {/* Tab Navigation */}
      <nav
        aria-label="Settings tabs"
        className="bg-white border border-gray-100 rounded-xl shadow-sm flex overflow-x-auto"
        style={{ scrollbarWidth: 'none' }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`settings-tab-${tab.id}`}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center justify-center gap-2 flex-1 py-4 px-5 min-w-fit border-b-2 font-bold text-sm transition-colors ${
                isActive
                  ? 'border-[#16A34A] text-[#16A34A] bg-[#F0FDF4]/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
              {tab.name}
            </button>
          );
        })}
      </nav>

      {/* Tab Content */}
      <main>{renderContent()}</main>

      {/* Sticky Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 sm:pl-[280px] pointer-events-none">
        <div className="max-w-[1200px] mx-auto flex justify-end">
          <button
            id="settings-save-btn"
            onClick={() => {
              if (activeTab === 'store-profile') {
                const form = document.getElementById('shop-profile-form');
                if (form) {
                  form.requestSubmit();
                } else {
                  toast.success('Shop profile updated successfully!');
                }
              } else {
                toast.success('Settings saved successfully!');
              }
            }}
            className="flex items-center gap-2 px-5 py-3 bg-[#1E3A2B] text-white text-[13px] font-bold rounded-xl shadow-xl hover:bg-[#162A1F] transition-colors pointer-events-auto"
          >
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
