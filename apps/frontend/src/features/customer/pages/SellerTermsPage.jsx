import React from 'react';

export const SellerTermsPage = () => {
  return (
    <div className="min-h-screen py-16 px-6 sm:px-8 bg-gradient-to-b from-white to-[#F8FAF8]">
      <div className="max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#154D21] tracking-tight mb-4 uppercase">
            Seller Terms & Conditions
          </h1>
          <div className="w-16 h-1 bg-[#154D21] mx-auto rounded-full"></div>
        </div>

        {/* Intro */}
        <p className="text-gray-700 text-[15px] sm:text-base leading-relaxed font-semibold mb-8">
          Welcome to the Cravo Seller Community. By registering as a seller on our platform, you agree to abide by these terms designed to maintain trust, quality, and the authentic spirit of our marketplace.
        </p>

        {/* Sections */}
        <div className="flex flex-col gap-8 text-gray-700 text-[15px] sm:text-base leading-relaxed font-medium">
          
          {/* Section 1 */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 uppercase mb-4">
              1. Core Seller Requirements
            </h2>
            <div className="flex flex-col gap-4 pl-4 border-l-2 border-[#154D21]">
              <p>
                <strong className="text-gray-900 font-bold uppercase">Eligibility:</strong> Cravo is exclusively for home-based mothers and independent women entrepreneurs specializing in preserved food products.
              </p>
              <p>
                <strong className="text-gray-900 font-bold uppercase">Product Standards:</strong> Sellers must ensure all products meet food safety standards, use quality ingredients, and accurately represent traditional preparation methods.
              </p>
              <p>
                <strong className="text-gray-900 font-bold uppercase">Compliance:</strong> Sellers are responsible for complying with FSSAI regulations and providing transparent information about ingredients and shelf life.
              </p>
              <p>
                <strong className="text-gray-900 font-bold uppercase">Marketplace Rules:</strong> Maintaining professional standards in packaging, pricing transparency, and timely dispatch is mandatory for all sellers.
              </p>
            </div>
          </div>

          {/* Section 2 */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 uppercase mb-4">
              2. Product Listing & Authenticity
            </h2>
            <p className="pl-4">
              <strong className="text-[#154D21] font-bold">2.1</strong> Sellers must list only preserved food products (Pickles, Jams, Powders, etc.) that they prepare. Re-selling commercial products is strictly prohibited. Every listing must include a clear description and high-quality images.
            </p>
          </div>

          {/* Section 3 */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 uppercase mb-4">
              3. Pricing & Commission
            </h2>
            <p className="pl-4">
              <strong className="text-[#154D21] font-bold">3.1</strong> Sellers have the freedom to set their own prices. Cravo charges a standard commission on every successful sale as disclosed during onboarding. Sellers are prohibited from including hidden charges or surcharges.
            </p>
          </div>

          {/* Section 4 */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 uppercase mb-4">
              4. Order Fulfillment
            </h2>
            <p className="pl-4">
              <strong className="text-[#154D21] font-bold">4.1</strong> Orders must be accepted and processed promptly. Sellers are responsible for secure packaging to prevent transit damage. Delay in dispatch or high cancellation rates may lead to account penalties.
            </p>
          </div>

          {/* Section 5 */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 uppercase mb-4">
              5. Ethical Conduct
            </h2>
            <p className="pl-4">
              <strong className="text-[#154D21] font-bold">5.1</strong> Cravo is built on the empowerment of women. We expect all sellers to conduct business ethically, respect intellectual property, and provide honest information to the buyer community.
            </p>
          </div>

          {/* Section 6 */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 uppercase mb-4">
              6. Updates to Terms
            </h2>
            <p className="pl-4">
              Cravo reserves the right to modify these terms. Sellers will be notified of significant changes through the dashboard. Continued use of the seller platform signifies acceptance of updated terms.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
