import React from 'react';

export const PrivacyPolicyPage = () => {
  return (
    <div className="max-w-4xl mx-auto py-16 px-6">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 font-serif">Privacy Policy</h1>
      <div className="prose prose-lg text-gray-600">
        <p className="mb-4">Last updated: June 2026</p>
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
        <p className="mb-4">
          We collect information that you provide directly to us, such as when you create or modify your account, 
          request services, contact customer support, or otherwise communicate with us.
        </p>
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Use of Information</h2>
        <p className="mb-4">
          We may use the information we collect to provide, maintain, and improve our services, 
          including facilitating payments, sending receipts, and providing products you request.
        </p>
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Data Security</h2>
        <p className="mb-4">
          We take reasonable measures to help protect information about you from loss, theft, misuse, 
          unauthorized access, disclosure, alteration, and destruction.
        </p>
      </div>
    </div>
  );
};
