import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, CheckCircle2, XCircle, AlertTriangle,
  Store, FileText, ExternalLink, RefreshCw
} from 'lucide-react';

const DocumentPreview = ({ doc }) => {
  const isPdf = doc.fileUrl?.endsWith('.pdf') || doc.publicId?.includes('pdf');
  const typeLabel = {
     ID_PROOF: 'ID Proof',
     ADDRESS_PROOF: 'Address Proof',
     SHOP_IMAGE: 'Shop Photo',
     FSSAI_LICENSE: 'FSSAI License',
  }[doc.type] || doc.type;

  return (
    <a
      href={doc.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-100 rounded-xl hover:border-[#1E3A2B] hover:bg-[#F0F8F3] transition-colors group"
    >
      <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
        {isPdf ? (
          <FileText size={22} className="text-red-500" />
        ) : (
          <img src={doc.fileUrl} alt={typeLabel} className="w-full h-full object-cover rounded-lg" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">{typeLabel}</p>
        <p className="text-xs text-gray-400 truncate">{isPdf ? 'PDF Document' : 'Image'}</p>
      </div>
      <ExternalLink size={15} className="text-gray-400 group-hover:text-[#1E3A2B] shrink-0 transition-colors" />
    </a>
  );
};

export const SellerStatusView = ({ application, onReapply }) => {
  const { status, rejectionReason, documents = [] } = application;

  const statusConfig = {
    PENDING: {
      icon: <Clock size={40} className="text-amber-500" />,
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      badge: 'bg-amber-100 text-amber-700',
      title: 'Application Under Review',
      subtitle: 'Our team is reviewing your documents. This usually takes 24–48 hours. You will be notified once a decision is made.',
    },
    APPROVED: {
      icon: <CheckCircle2 size={40} className="text-emerald-500" />,
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      badge: 'bg-emerald-100 text-emerald-700',
      title: 'Application Approved! 🎉',
      subtitle: "Congratulations! You're now a verified Cravo seller. Set up your shop and start selling today.",
    },
    REJECTED: {
      icon: <XCircle size={40} className="text-red-500" />,
      bg: 'bg-red-50',
      border: 'border-red-200',
      badge: 'bg-red-100 text-red-700',
      title: 'Application Not Approved',
      subtitle: 'Unfortunately, your application was not approved at this time. Please review the reason below and reapply.',
    },
    SUSPENDED: {
      icon: <AlertTriangle size={40} className="text-orange-500" />,
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      badge: 'bg-orange-100 text-orange-700',
      title: 'Account Suspended',
      subtitle: 'Your seller account has been suspended. Please contact our support team for assistance.',
    },
  };

  const config = statusConfig[status] || statusConfig.PENDING;

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Main Status Card */}
      <div className={`${config.bg} border-2 ${config.border} rounded-2xl p-8 text-center`}>
        <div className="flex justify-center mb-5">{config.icon}</div>
        <div className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 ${config.badge}`}>
          {status}
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-3">{config.title}</h1>
        <p className="text-gray-600 text-base leading-relaxed max-w-md mx-auto">{config.subtitle}</p>

        {/* CTA buttons per status */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          {status === 'APPROVED' && (
            <Link
              to="/seller/setup-shop"
              className="inline-flex items-center gap-2 bg-[#1E3A2B] text-white font-bold px-8 py-3.5 rounded-full hover:bg-[#162A1F] transition-colors shadow-lg"
            >
              <Store size={20} />
              Create My Shop
            </Link>
          )}
          {status === 'REJECTED' && onReapply && (
            <button
              onClick={onReapply}
              className="inline-flex items-center gap-2 bg-[#1E3A2B] text-white font-bold px-8 py-3.5 rounded-full hover:bg-[#162A1F] transition-colors shadow-lg"
            >
              <RefreshCw size={18} />
              Re-Apply Now
            </button>
          )}
          {status === 'SUSPENDED' && (
            <a
              href="mailto:support@cravo.in"
              className="inline-flex items-center gap-2 bg-orange-500 text-white font-bold px-8 py-3.5 rounded-full hover:bg-orange-600 transition-colors"
            >
              Contact Support
            </a>
          )}
        </div>
      </div>

      {/* Rejection Reason */}
      {status === 'REJECTED' && rejectionReason && (
        <div className="bg-white border border-red-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-3">
            <XCircle size={18} className="text-red-500" />
            Reason for Rejection
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed bg-red-50 border border-red-100 rounded-lg p-4">
            {rejectionReason}
          </p>
        </div>
      )}

      {/* Submitted Documents */}
      {documents.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-4">Submitted Documents</h2>
          <div className="space-y-3">
            {documents.map((doc) => (
              <DocumentPreview key={doc.id} doc={doc} />
            ))}
          </div>
        </div>
      )}

      {/* Timeline/info for PENDING */}
      {status === 'PENDING' && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-4">What happens next?</h2>
          <div className="space-y-4">
            {[
              { label: 'Documents Received', done: true, desc: 'Your KYC documents are safely uploaded.' },
              { label: 'Under Review', done: true, desc: 'Our team is reviewing your application.' },
              { label: 'Decision Made', done: false, desc: 'You will receive an email notification.' },
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${step.done ? 'bg-[#1E3A2B] border-[#1E3A2B]' : 'border-gray-300'}`}>
                  {step.done && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  )}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${step.done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
