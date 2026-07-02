import React from 'react';

export const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen py-16 px-6 sm:px-8 bg-gradient-to-b from-white to-[#F8FAF8]">
      <div className="max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#154D21] tracking-tight mb-4 uppercase">
            Privacy Policy
          </h1>
          <div className="w-16 h-1 bg-[#154D21] mx-auto rounded-full"></div>
        </div>

        {/* Policy Paragraphs */}
        <div className="flex flex-col gap-8 text-gray-700 text-[15px] sm:text-base leading-relaxed font-medium">
          <p>
            Cravo is committed to protecting the privacy and security of every customer who visits our website. This Privacy Policy explains how we collect, use, store, and protect your information when you access or make purchases through our platform.
          </p>

          <p>
            When you browse our website or place an order, we may collect personal details including your full name, email address, phone number, billing address, shipping address, and order-related information. This information is necessary to process transactions, deliver products, respond to customer inquiries, and maintain accurate business records. Without this information, we may not be able to fulfill your order.
          </p>

          <p>
            Payments on Cravo are processed securely through Razorpay. We do not store debit card numbers, credit card details, UPI IDs, CVV numbers, or net banking credentials. All payment transactions are encrypted and handled through secure payment infrastructure. Cravo only receives confirmation of successful payment and transaction reference details.
          </p>

          <p>
            We do not sell, rent, lease, or trade your personal information to third parties for marketing or promotional activities. Your information is used solely for operational purposes such as order processing, customer communication, shipping coordination, and compliance with legal requirements. Information may be shared only when required by law or when strictly necessary to complete delivery of your order through logistics partners.
          </p>

          <p>
            We take reasonable administrative and technical precautions to protect your data from unauthorized access, misuse, loss, or alteration. While we implement appropriate security measures, no method of electronic transmission or storage can guarantee absolute security. By using our platform, you acknowledge and accept this risk.
          </p>

          <p>
            Our website may use basic cookies to enhance user experience, remember preferences, and improve website functionality. Cookies do not collect sensitive financial information. You may choose to disable cookies through your browser settings, though some website features may not function properly.
          </p>

          <p>
            Cravo may update this Privacy Policy periodically to reflect operational, regulatory, or legal changes. Any updates will be posted on this page and will take effect immediately upon publication. Continued use of the website after changes indicates acceptance of the updated policy.
          </p>

          <p>
            If you have questions regarding this Privacy Policy or data handling practices, you may contact us through the contact details provided on our website.
          </p>
        </div>
      </div>
    </div>
  );
};

