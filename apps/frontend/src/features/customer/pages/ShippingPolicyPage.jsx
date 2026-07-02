import React from 'react';

export const ShippingPolicyPage = () => {
  return (
    <div className="min-h-screen py-16 px-6 sm:px-8 bg-gradient-to-b from-white to-[#F8FAF8]">
      <div className="max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#154D21] tracking-tight mb-4 uppercase">
            Shipping Policy
          </h1>
          <div className="w-16 h-1 bg-[#154D21] mx-auto rounded-full"></div>
        </div>

        {/* Policy Paragraphs */}
        <div className="flex flex-col gap-8 text-gray-700 text-[15px] sm:text-base leading-relaxed font-medium">
          <p>
            Cravo processes orders only after successful payment confirmation. Orders are typically prepared and dispatched within 2 to 3 business days, excluding weekends and public holidays. Processing times may vary during peak seasons, promotional periods, or due to operational constraints.
          </p>
          <p>
            Delivery timelines generally range between 3 to 7 business days depending on the customer's location, courier availability, and regional logistics operations. These timelines are estimated and not guaranteed. External factors such as weather conditions, transportation disruptions, regulatory restrictions, or high shipping volumes may result in delays beyond our control.
          </p>
          <p>
            Shipping charges, where applicable, are calculated during checkout based on delivery location, order weight, and courier service rates. The total shipping cost is displayed before payment confirmation.
          </p>
          <p>
            Customers are responsible for providing complete and accurate shipping details at the time of order placement. Cravo will not be liable for delivery failures, delays, or additional charges resulting from incorrect, incomplete, or outdated address information.
          </p>
          <p>
            Once an order is dispatched, tracking details may be provided when available. Customers are responsible for coordinating with courier services in case of missed deliveries or re-attempts.
          </p>
          <p>
            Risk of loss and title for purchased products pass to the customer upon delivery to the shipping address provided at checkout.
          </p>
          <p>
            Cravo may revise its shipping procedures or timelines at any time based on operational requirements.
          </p>
        </div>
      </div>
    </div>
  );
};
