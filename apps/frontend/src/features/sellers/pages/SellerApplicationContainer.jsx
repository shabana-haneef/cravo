import React, { useState } from 'react';
import { useSellerApplication } from '../hooks/useSellerQueries.js';
import { SellerApplicationForm } from '../components/SellerApplicationForm.jsx';
import { SellerStatusView } from '../components/SellerStatusView.jsx';
import { Loader2, AlertCircle } from 'lucide-react';

const Skeleton = () => (
  <div className="max-w-2xl mx-auto animate-pulse space-y-6 pt-8">
    <div className="h-16 w-16 bg-gray-200 rounded-2xl mx-auto"></div>
    <div className="h-8 w-64 bg-gray-200 rounded-lg mx-auto"></div>
    <div className="h-4 w-80 bg-gray-100 rounded mx-auto"></div>
    <div className="bg-white border border-gray-100 rounded-2xl p-7 space-y-4">
      <div className="h-5 w-32 bg-gray-200 rounded"></div>
      <div className="h-24 bg-gray-100 rounded-xl"></div>
    </div>
    <div className="bg-white border border-gray-100 rounded-2xl p-7 space-y-4">
      <div className="h-5 w-40 bg-gray-200 rounded"></div>
      <div className="h-28 bg-gray-100 rounded-xl"></div>
      <div className="h-28 bg-gray-100 rounded-xl"></div>
    </div>
  </div>
);

export const SellerApplicationContainer = () => {
  const { data, isLoading, isError, refetch } = useSellerApplication();
  const [showForm, setShowForm] = useState(false);

  if (isLoading) {
    return (
      <div className="py-12 px-4">
        <Skeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-20 px-4 flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
          <AlertCircle size={28} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Something went wrong</h2>
        <p className="text-gray-500 text-sm">We couldn't load your application. Please try again.</p>
        <button
          onClick={refetch}
          className="mt-2 px-6 py-2.5 bg-[#1E3A2B] text-white text-sm font-bold rounded-full hover:bg-[#162A1F] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const application = data?.data?.application;

  // No application yet, or REJECTED and user clicked "Re-Apply"
  const shouldShowForm = !application || showForm;

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4">
      {shouldShowForm ? (
        <SellerApplicationForm />
      ) : (
        <SellerStatusView
          application={application}
          onReapply={application.status === 'REJECTED' ? () => setShowForm(true) : undefined}
        />
      )}
    </div>
  );
};
