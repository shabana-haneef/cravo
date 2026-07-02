import React from 'react';
import { Mail, Phone, Clock } from 'lucide-react';

export const ContactUsPage = () => {
  return (
    <div className="min-h-screen py-16 px-6 sm:px-8 bg-gradient-to-b from-white to-[#F8FAF8]">
      <div className="max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#154D21] tracking-tight mb-4 uppercase">
            Contact Us
          </h1>
          <div className="w-16 h-1 bg-[#154D21] mx-auto rounded-full"></div>
        </div>

        {/* Intro copy */}
        <div className="flex flex-col gap-6 text-gray-700 text-sm sm:text-base leading-relaxed mb-8">
          <p>
            At Cravo, we are committed to providing reliable support to both our customers and sellers. If you have questions regarding orders, payments, shipping, product information, or general inquiries, our support team is here to assist you.
          </p>
          <p>
            For faster resolution, we recommend including your Order ID or registered email address when contacting us about an existing order.
          </p>
        </div>

        {/* Grid of contact cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
          {/* Email Support Card */}
          <div className="bg-white border border-gray-100 p-8 rounded-2xl flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow duration-300 motion-reduce:transition-none">
            <div className="w-12 h-12 rounded-xl bg-[#E8F5E9] text-[#154D21] flex items-center justify-center mb-4">
              <Mail size={24} className="stroke-[1.5]" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Customer Support Email</h3>
            <a 
              href="mailto:cravofoods10@gmail.com" 
              className="text-[#154D21] font-semibold text-sm hover:underline transition-all duration-200 motion-reduce:transition-none break-all"
            >
              cravofoods10@gmail.com
            </a>
          </div>

          {/* Phone Support Card */}
          <div className="bg-white border border-gray-100 p-8 rounded-2xl flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow duration-300 motion-reduce:transition-none">
            <div className="w-12 h-12 rounded-xl bg-[#E8F5E9] text-[#154D21] flex items-center justify-center mb-4">
              <Phone size={24} className="stroke-[1.5]" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Phone Support</h3>
            <a 
              href="tel:+918129490977" 
              className="text-[#154D21] font-semibold text-sm hover:underline transition-all duration-200 motion-reduce:transition-none"
            >
              +91-8129490977
            </a>
          </div>
        </div>

        {/* Business Hours Banner */}
        <div className="bg-[#F4FBF7] border border-[#E2F2E7] p-8 rounded-2xl mb-8 flex flex-col gap-4">
          <div className="flex items-center gap-4 text-[#154D21]">
            <Clock size={24} className="stroke-[1.5]" />
            <h3 className="font-bold text-lg">Business Hours</h3>
          </div>
          <div className="text-gray-700 text-sm sm:text-base leading-relaxed pl-10">
            <p className="font-medium text-gray-500">Monday to Saturday</p>
            <p className="font-bold text-lg text-gray-900 mb-4">9:00 AM – 6:00 PM</p>
            <div className="border-t border-[#E2F2E7] pt-4 text-xs sm:text-sm text-gray-500 font-medium">
              We aim to respond to all queries within 24 to 48 business hours.
            </div>
          </div>
        </div>

        {/* Post-banner copy & Seller Support */}
        <div className="flex flex-col gap-6 text-gray-700 text-sm sm:text-base leading-relaxed">
          <p>
            For order-related concerns such as damaged products, incorrect delivery, or refund requests, please contact us within <strong className="text-gray-900 font-bold">48 hours of delivery</strong> and provide relevant details for verification.
          </p>

          <div className="border-t border-gray-100 pt-8 mt-4">
            <h2 className="text-lg font-bold text-[#154D21] mb-4">Seller Support</h2>
            <p className="mb-4">
              If you are a seller and require assistance regarding onboarding, product listing, settlements, or compliance, please contact our seller support team through your dashboard or email us with your registered seller details.
            </p>
            <p>
              At Cravo, we value clear communication and timely support. We are continuously working to improve our service standards to ensure a smooth and dependable marketplace experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

