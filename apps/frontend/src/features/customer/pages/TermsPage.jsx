import React from 'react';

export const TermsPage = () => {
  return (
    <div className="min-h-screen py-16 px-6 sm:px-8 bg-gradient-to-b from-white to-[#F8FAF8]">
      <div className="max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#154D21] tracking-tight mb-4 uppercase">
            Terms of Service
          </h1>
          <div className="w-16 h-1 bg-[#154D21] mx-auto rounded-full"></div>
        </div>

        {/* Policy Paragraphs */}
        <div className="flex flex-col gap-8 text-gray-700 text-[15px] sm:text-base leading-relaxed font-medium">
          <p>
            By accessing, browsing, or purchasing from the Cravo website, you agree to comply with and be bound by these Terms of Service. These terms govern your use of the platform and all transactions conducted through it.
          </p>

          <p>
            Cravo operates as an online platform offering preserved food products for sale. Product descriptions, images, and pricing are presented as accurately as possible; however, minor variations in packaging, labeling, or presentation may occur due to batch production or supplier updates.
          </p>

          <p>
            All prices displayed on the website are in Indian Rupees. Orders are confirmed only after successful payment processing. Cravo reserves the right to cancel or refuse any order due to product unavailability, pricing errors, suspected fraudulent activity, or technical issues.
          </p>

          <p>
            Customers are responsible for reviewing ingredient lists and product details prior to purchase. Cravo shall not be responsible for allergic reactions, dietary incompatibilities, or health-related issues arising from consumption of products purchased through the platform. Customers with specific dietary restrictions are advised to verify product suitability before ordering.
          </p>

          <p>
            All website content including logos, images, text, graphics, and branding elements are the intellectual property of Cravo. Unauthorized copying, reproduction, or commercial use of website materials is strictly prohibited.
          </p>

          <p>
            Cravo shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use products purchased through the platform. Use of the website and purchase of products are at the customer's own discretion and risk.
          </p>

          <p>
            We reserve the right to update, modify, or revise these Terms of Service at any time without prior notice. Continued use of the website after changes constitutes acceptance of the revised terms.
          </p>

          <p>
            These terms shall be governed by and interpreted in accordance with the laws of India. Any disputes arising out of or relating to the use of the website shall be subject to the jurisdiction of competent courts in India.
          </p>
        </div>
      </div>
    </div>
  );
};

