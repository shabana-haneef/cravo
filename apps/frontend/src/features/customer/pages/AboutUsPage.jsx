import React from 'react';

export const AboutUsPage = () => {
  return (
    <div className="min-h-screen py-16 px-6 sm:px-8 bg-gradient-to-b from-white to-[#F8FAF8]">
      <div className="max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#154D21] tracking-tight mb-4 uppercase">
            About Us
          </h1>
          <div className="w-16 h-1 bg-[#154D21] mx-auto rounded-full"></div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col gap-8 text-gray-700 text-[15px] sm:text-base leading-relaxed font-medium">
          <p>
            Cravo is a specialized online marketplace dedicated to preserved food products prepared by home-based mothers and independent women entrepreneurs. Our platform is built to connect authentic, carefully preserved food items with customers seeking quality, tradition, and reliability.
          </p>

          <p>
            At Cravo, we focus exclusively on preserved foods that are prepared with care and packaged to maintain freshness, safety, and shelf stability. Every product listed on our platform represents the effort, skill, and dedication of mothers who bring traditional recipes and time-tested preparation methods into modern homes.
          </p>

          <p>
            Cravo operates as a structured, technology-driven marketplace. We provide sellers with a digital platform to showcase their preserved products while ensuring a secure, transparent, and organized buying experience for customers. Sellers are required to comply with applicable food standards and provide accurate product information to maintain consistency and trust across the platform.
          </p>

          <p>
            For customers, Cravo offers a seamless shopping experience with secure payments, clear product details, and reliable delivery services. We aim to ensure that every purchase reflects quality, transparency, and confidence.
          </p>

          <p>
            Our mission is to empower home-based mothers by giving them access to a wider market while maintaining professional standards in operations, pricing transparency, and customer service. By combining traditional food craftsmanship with modern e-commerce infrastructure, Cravo creates a bridge between authentic preserved foods and households across India.
          </p>

          <p>
            We are committed to building a marketplace grounded in trust, accountability, and long-term value for both customers and sellers. As we grow, our focus remains on strengthening seller partnerships, enhancing product quality standards, and delivering a dependable shopping experience.
          </p>

          {/* Highlighted Footer Text */}
          <p className="text-[#154D21] font-bold text-center text-lg sm:text-xl border-t border-gray-100 pt-8 mt-4">
            Cravo stands for preserved authenticity, responsible commerce, and the empowerment of women-led food enterprises.
          </p>
        </div>
      </div>
    </div>
  );
};

