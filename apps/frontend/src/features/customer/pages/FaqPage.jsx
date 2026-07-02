import React from 'react';

export const FaqPage = () => {
  return (
    <div className="max-w-4xl mx-auto py-16 px-6">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 font-serif">Frequently Asked Questions</h1>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-2">How long does delivery take?</h3>
          <p className="text-gray-600">Most local deliveries are completed within 2-4 hours of placing the order.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Are all products organic?</h3>
          <p className="text-gray-600">Products marked with the 'Organic' badge are certified organic by our trusted local sellers.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-2">How can I become a seller?</h3>
          <p className="text-gray-600">You can easily become a seller by clicking the "Sell on Cravo" button at the top of the page and filling out our quick application form.</p>
        </div>
      </div>
    </div>
  );
};
