import React from 'react';

export const TermsPage = () => {
  return (
    <div className="max-w-4xl mx-auto py-16 px-6">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 font-serif">Terms & Conditions</h1>
      <div className="prose prose-lg text-gray-600">
        <p className="mb-4">Last updated: June 2026</p>
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
        <p className="mb-4">
          By accessing and using Cravo Marketplace, you accept and agree to be bound by the terms and provision of this agreement.
        </p>
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. User Conduct</h2>
        <p className="mb-4">
          You agree to use our services only for lawful purposes. You must not use our platform in any way that causes, 
          or may cause, damage to the website or impairment of the availability or accessibility of the website.
        </p>
      </div>
    </div>
  );
};
