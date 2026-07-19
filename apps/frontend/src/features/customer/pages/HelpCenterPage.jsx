import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLogout } from '../../auth/hooks/useAuthQueries.js';
import {
  Search, ChevronRight, Mail, Phone, MessageCircle, Clock,
  RefreshCcw, Truck, User, ChevronUp, Tag, Box, CreditCard,
  Package, Headphones, ShieldCheck, AlertCircle
} from 'lucide-react';

// ── Static Data ────────────────────────────────────────────────────────────────

const quickHelp = [
  { icon: Box,        color: '#00B37E', bg: '#E6FFF8', title: 'Track My Order',    desc: 'Track your order status and delivery',        to: '/orders' },
  { icon: RefreshCcw, color: '#F97316', bg: '#FFF4EB', title: 'Returns / Refunds', desc: 'Request a return or check your refund status', to: '/orders' },
  { icon: CreditCard, color: '#6366F1', bg: '#EEF2FF', title: 'Payment Issue',     desc: 'Help with payments and failed transactions',   to: '/orders' },
  { icon: Truck,      color: '#9B59B6', bg: '#F5EDFF', title: 'Delivery Issue',    desc: 'Report delivery issues or delays',             to: '/orders' },
];

const helpTopics = [
  { icon: Package,    color: '#154D21', bg: '#E8F5EE', label: 'Orders',            desc: 'Track, cancel, modify',        to: '/orders' },
  { icon: CreditCard, color: '#6366F1', bg: '#EEF2FF', label: 'Payments',          desc: 'Payment methods, failures',    to: '/orders' },
  { icon: RefreshCcw, color: '#F97316', bg: '#FFF4EB', label: 'Returns & Refunds', desc: 'Returns, refunds, exchange',   to: '/orders' },
  { icon: Truck,      color: '#9B59B6', bg: '#F5EDFF', label: 'Delivery',          desc: 'Shipping, tracking, delays',   to: '/orders' },
  { icon: User,       color: '#06B6D4', bg: '#ECFEFF', label: 'Account & Login',   desc: 'Login issues, account help',   to: '/profile' },
  { icon: Tag,        color: '#CA8A04', bg: '#FEFCE8', label: 'Offers & Coupons',  desc: 'Discounts, coupons help',      to: '/products' },
];

const allFaqs = [
  {
    q: 'How do I track my order?',
    a: 'You can track your order by navigating to the Orders section in your account and clicking on the specific order. Real-time delivery updates and tracking details will be displayed there.',
  },
  {
    q: 'How do I cancel an order?',
    a: "To cancel an order, go to the Orders section, select the order you wish to cancel, and click 'Cancel Order'. Cancellations are only available before the order has been dispatched by the seller.",
  },
  {
    q: 'When will I receive my refund?',
    a: 'Refunds are processed within 5–7 business days after we confirm your return. The amount will be credited back to your original payment method — card, UPI, or wallet.',
  },
  {
    q: 'How do I change my delivery address?',
    a: 'Go to the Addresses section in your account to add, edit, or delete your saved delivery addresses. You can also select a different address during checkout before placing your order.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We accept UPI, credit and debit cards (Visa, Mastercard, RuPay), net banking, and popular wallets via Razorpay. Cash on Delivery is available at select pin codes.',
  },
  {
    q: 'Is it safe to save my payment details?',
    a: 'Yes, absolutely. All payment data is handled securely by Razorpay, which is PCI-DSS Level 1 compliant. Cravo never stores your card or UPI credentials on our servers.',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export const HelpCenterPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq]         = useState(null);
  const [showAllFaqs, setShowAllFaqs] = useState(false);

  const baseFaqs     = showAllFaqs ? allFaqs : allFaqs.slice(0, 5);
  const filteredFaqs = baseFaqs.filter(
    ({ q, a }) =>
      q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto">

      {/* Page Hero */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1 tracking-tight">Help Center</h1>
          <p className="text-gray-500 text-[14px] font-medium">How can we help you today?</p>
        </div>
        <div className="w-[72px] h-[72px] bg-[#E8F5EE] rounded-2xl flex items-center justify-center shadow-sm">
          <Headphones size={34} className="text-[#154D21]" strokeWidth={1.5} />
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setShowAllFaqs(true); }}
          placeholder="Search for help topics (orders, refunds, payments...)"
          className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-[13.5px] outline-none focus:border-[#154D21] focus:ring-2 focus:ring-[#154D21]/10 transition-all shadow-sm placeholder:text-gray-400"
        />
      </div>

      {/* ── Non-search sections ─────────────────────────────────────────────── */}
      {!searchQuery && (
        <>
          {/* Quick Help */}
          <section className="mb-8">
            <h2 className="text-[13px] font-bold text-gray-500 uppercase tracking-widest mb-4">Quick Help</h2>
            <div className="grid grid-cols-4 gap-4">
              {quickHelp.map(({ icon: Icon, color, bg, title, desc, to }) => (
                <Link
                  key={title}
                  to={to}
                  className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-gray-200 transition-all group flex flex-col"
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: bg }}>
                    <Icon size={20} style={{ color }} strokeWidth={2} />
                  </div>
                  <div className="font-bold text-gray-800 text-[13px] mb-1.5 leading-snug">{title}</div>
                  <div className="text-gray-400 text-[12px] leading-relaxed mb-4 flex-1">{desc}</div>
                  <ChevronRight
                    size={17}
                    style={{ color }}
                    className="group-hover:translate-x-0.5 transition-transform"
                    strokeWidth={2.5}
                  />
                </Link>
              ))}
            </div>
          </section>

          {/* Contact Us */}
          <section className="mb-8">
            <h2 className="text-[13px] font-bold text-gray-500 uppercase tracking-widest mb-4">Contact Us</h2>
            <div className="grid grid-cols-3 gap-4">

              <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#E8F5EE] rounded-xl flex items-center justify-center shrink-0">
                    <Mail size={17} className="text-[#154D21]" strokeWidth={2} />
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 text-[13px]">Email Support</div>
                    <div className="text-gray-400 text-[11.5px]">Usually replies within 24 hours</div>
                  </div>
                </div>
                <a href="mailto:support@cravo.com" className="text-[#154D21] font-semibold text-[13px] hover:underline">
                  support@cravo.com
                </a>
                <a href="mailto:support@cravo.com" className="flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-2.5 text-[12.5px] font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                  <Mail size={13} strokeWidth={2} /> Send Email
                </a>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#E8F5EE] rounded-xl flex items-center justify-center shrink-0">
                    <Phone size={17} className="text-[#154D21]" strokeWidth={2} />
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 text-[13px]">Call Support</div>
                    <div className="text-gray-400 text-[11.5px]">Mon – Sat, 9 AM – 6 PM</div>
                  </div>
                </div>
                <a href="tel:+918129490977" className="text-[#154D21] font-semibold text-[13px] hover:underline">
                  +91 81294 90977
                </a>
                <a href="tel:+918129490977" className="flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-2.5 text-[12.5px] font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                  <Phone size={13} strokeWidth={2} /> Call Now
                </a>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#E8F5EE] rounded-xl flex items-center justify-center shrink-0">
                    <MessageCircle size={17} className="text-[#154D21]" strokeWidth={2} />
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 text-[13px]">WhatsApp Support</div>
                    <div className="text-gray-400 text-[11.5px]">Chat with us on WhatsApp</div>
                  </div>
                </div>
                <span className="text-gray-400 text-[13px] font-medium">Available 9 AM – 6 PM</span>
                <a
                  href="https://wa.me/918129490977"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-2.5 text-[12.5px] font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <MessageCircle size={13} strokeWidth={2} /> Chat Now
                </a>
              </div>
            </div>
          </section>

          {/* Popular Help Topics */}
          <section className="mb-8">
            <h2 className="text-[13px] font-bold text-gray-500 uppercase tracking-widest mb-4">Popular Help Topics</h2>
            <div className="grid grid-cols-3 gap-3">
              {helpTopics.map(({ icon: Icon, color, bg, label, desc, to }) => (
                <Link
                  key={label}
                  to={to}
                  className="bg-white border border-gray-100 rounded-xl px-4 py-3.5 flex items-center gap-3 hover:shadow-md hover:border-gray-200 transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg }}>
                    <Icon size={16} style={{ color }} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800 text-[13px] leading-tight">{label}</div>
                    <div className="text-gray-400 text-[11.5px] mt-0.5 truncate">{desc}</div>
                  </div>
                  <ChevronRight size={15} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all shrink-0" strokeWidth={2} />
                </Link>
              ))}
            </div>
          </section>
        </>
      )}

      {/* ── FAQ + Support Hours ─────────────────────────────────────────────── */}
      <div className="flex gap-6 items-start">

        {/* FAQs */}
        <div className="flex-1 min-w-0">
          <h2 className="text-[13px] font-bold text-gray-500 uppercase tracking-widest mb-4">
            {searchQuery ? `Results for "${searchQuery}"` : 'Frequently Asked Questions'}
          </h2>

          {filteredFaqs.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
              <AlertCircle size={28} className="text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-gray-500 font-semibold text-[13.5px]">No results found for "{searchQuery}"</p>
              <p className="text-gray-400 text-[12px] mt-1">Try different keywords or browse the topics above.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredFaqs.map(({ q, a }, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className={`bg-white border rounded-xl overflow-hidden transition-all shadow-sm ${
                      isOpen ? 'border-[#154D21]/25 shadow-md' : 'border-gray-100'
                    }`}
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left group"
                    >
                      <span className={`text-[13.5px] font-semibold transition-colors ${isOpen ? 'text-[#154D21]' : 'text-gray-800 group-hover:text-[#154D21]'}`}>
                        {q}
                      </span>
                      {isOpen
                        ? <ChevronUp size={16} className="text-[#154D21] shrink-0 ml-4" strokeWidth={2.5} />
                        : <ChevronRight size={16} className="text-gray-400 shrink-0 ml-4 group-hover:text-[#154D21]" strokeWidth={2} />
                      }
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 border-t border-gray-100">
                        <p className="text-gray-500 text-[13px] leading-relaxed pt-3">{a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!searchQuery && (
            <button
              onClick={() => setShowAllFaqs(v => !v)}
              className="mt-4 text-[#154D21] font-bold text-[13px] flex items-center gap-1.5 hover:underline"
            >
              {showAllFaqs ? 'Show Less' : 'View All FAQs'}
              <ChevronRight size={14} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Support Hours */}
        {!searchQuery && (
          <div className="w-[210px] shrink-0 flex flex-col gap-3">
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 bg-[#E8F5EE] rounded-lg flex items-center justify-center">
                  <Clock size={15} className="text-[#154D21]" strokeWidth={2} />
                </div>
                <span className="font-bold text-gray-800 text-[13px]">Support Hours</span>
              </div>
              <p className="text-gray-500 text-[11.5px] mb-1">Monday to Saturday</p>
              <p className="text-gray-900 font-extrabold text-lg tracking-tight">9:00 AM – 6:00 PM</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 bg-[#E8F5EE] rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <MessageCircle size={14} className="text-[#154D21]" strokeWidth={2} />
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-[12.5px] leading-tight">Average Response Time</p>
                  <p className="text-gray-400 text-[11.5px] mt-1">Usually within 24 hours</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 border-t border-gray-100 pt-4">
                <div className="w-8 h-8 bg-[#E8F5EE] rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck size={14} className="text-[#154D21]" strokeWidth={2} />
                </div>
                <p className="text-gray-500 text-[11.5px] leading-relaxed">
                  We're here to help you have a smooth shopping experience with Cravo.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="mt-8 bg-white border border-gray-100 rounded-2xl px-7 py-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#E8F5EE] rounded-xl flex items-center justify-center shrink-0">
            <MessageCircle size={20} className="text-[#154D21]" strokeWidth={2} />
          </div>
          <div>
            <p className="font-bold text-gray-800 text-[14px]">Can't find what you're looking for?</p>
            <p className="text-gray-400 text-[13px] mt-0.5">Our support team is ready to help you with any issue.</p>
          </div>
        </div>
        <a
          href="https://wa.me/918129490977"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-[#154D21] hover:bg-[#103B19] text-white font-bold text-[13px] px-5 py-3 rounded-xl transition-colors shadow-sm whitespace-nowrap"
        >
          <Headphones size={16} strokeWidth={2} />
          Contact Support
        </a>
      </div>

    </div>
  );
};
