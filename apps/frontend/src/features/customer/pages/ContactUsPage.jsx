import React from 'react';

export const ContactUsPage = () => {
  return (
    <div className="max-w-4xl mx-auto py-16 px-6">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 font-serif">Contact Us</h1>
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <p className="text-gray-600 mb-8">
          Have a question or need assistance? We're here to help! Reach out to us using the contact information below.
        </p>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Email Support</h3>
            <p className="text-gray-600">support@cravo.in</p>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Phone Support</h3>
            <p className="text-gray-600">+91 98765 43210</p>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Office Address</h3>
            <p className="text-gray-600">123 Tech Park, Kerala, India</p>
          </div>
        </div>
      </div>
    </div>
  );
};
