import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FaqPage = () => {
  const [activeQuestion, setActiveQuestion] = useState(null);

  const toggleQuestion = (id) => {
    setActiveQuestion(activeQuestion === id ? null : id);
  };

  const faqData = [
    {
      category: 'Product & Quality',
      items: [
        {
          id: 'pq-1',
          question: 'What makes Cravo products specialized?',
          answer: 'Cravo specializes exclusively in preserved food products, such as traditional pickles, jams, dehydrated goods, and spice mixes. Every product is carefully prepared to ensure shelf stability, authentic taste, and absolute safety, using traditional preservation methods that avoid harmful artificial preservatives.'
        },
        {
          id: 'pq-2',
          question: 'How do I check the shelf life of a product?',
          answer: 'The shelf life and expiry/best-before date of each product are clearly listed on its packaging and also detailed on the product page under specifications. Since our products are prepared using natural preservation techniques, we recommend storing them in a cool, dry place and using a clean, dry spoon.'
        },
        {
          id: 'pq-3',
          question: 'Are the products made by home-based mothers?',
          answer: 'Yes! All our products are prepared with care and dedication by home-based mothers and independent women entrepreneurs. By purchasing from Cravo, you are directly supporting women-led local food enterprises and helping them reach a wider market.'
        }
      ]
    },
    {
      category: 'Orders & Shipping',
      items: [
        {
          id: 'os-1',
          question: 'How do I track my order?',
          answer: 'Once your order is processed and dispatched, you will receive an email and SMS with tracking details. You can also track your order directly from your profile dashboard under the "Orders" section or by visiting the "Track Order" page.'
        },
        {
          id: 'os-2',
          question: 'What are the shipping charges?',
          answer: 'Shipping charges are calculated at checkout based on your delivery address, package weight, and choice of courier service. You will see the final shipping cost clearly detailed in your order summary before making any payment.'
        },
        {
          id: 'os-3',
          question: 'How long does delivery take?',
          answer: 'Deliveries typically take between 3 to 7 business days, depending on your location, local courier availability, and regional logistics. We work with leading logistics partners to ensure your order arrives safely and as quickly as possible.'
        }
      ]
    },
    {
      category: 'Payments & Refunds',
      items: [
        {
          id: 'pr-1',
          question: 'Is it safe to pay online on Cravo?',
          answer: 'Absolutely. Cravo uses fully secure, encrypted payment gateways that support all major credit cards, debit cards, UPI, net banking, and popular mobile wallets. Your payment credentials are never stored on our servers.'
        },
        {
          id: 'pr-2',
          question: 'Can I cancel my order?',
          answer: 'Orders can be cancelled before they are processed or dispatched by the seller. Once a seller has initiated shipping, cancellations are not possible. You can check the status of your order and request cancellation directly from your profile\'s order history page.'
        },
        {
          id: 'pr-3',
          question: 'What if I receive a damaged product?',
          answer: 'If you receive a product that is damaged or incorrect, please contact our customer support team within 48 hours of delivery. Please provide your Order ID along with photos or details of the damage for verification and quick resolution (refund or replacement).'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen py-16 px-6 sm:px-8 bg-gradient-to-b from-white to-[#F8FAF8]">
      <div className="max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#154D21] tracking-tight mb-4 uppercase">
            Frequently Asked Questions
          </h1>
          <div className="w-16 h-1 bg-[#154D21] mx-auto rounded-full"></div>
        </div>

        {/* Hero Help Banner */}
        <div className="bg-[#F4FBF7] border border-[#E2F2E7] p-8 rounded-2xl mb-12 flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#E8F5E9] text-[#154D21] flex items-center justify-center">
            <HelpCircle size={24} className="stroke-[1.5]" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold text-gray-900">How can we help you?</h2>
            <p className="text-gray-500 text-sm sm:text-base">Find answers to common questions about shopping on Cravo.</p>
          </div>
        </div>

        {/* FAQ Accordion Lists */}
        <div className="flex flex-col gap-12">
          {faqData.map((cat, catIdx) => (
            <div key={catIdx}>
              {/* Category Heading with Accent Line */}
              <h3 className="text-lg font-bold text-[#154D21] border-l-4 border-[#154D21] pl-4 mb-6">
                {cat.category}
              </h3>
              
              {/* Category Accordion Items */}
              <div className="divide-y divide-gray-100 border-t border-b border-gray-100">
                {cat.items.map((item) => {
                  const isOpen = activeQuestion === item.id;
                  return (
                    <div key={item.id} className="py-4">
                      <button
                        onClick={() => toggleQuestion(item.id)}
                        className="w-full flex items-center justify-between text-left font-bold text-gray-800 hover:text-[#154D21] transition-colors duration-200 focus:outline-none"
                      >
                        <span className="text-sm sm:text-base">{item.question}</span>
                        <span className="text-gray-400 shrink-0 ml-4">
                          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </span>
                      </button>
                      
                      {/* Smooth collapsible content container */}
                      <div 
                        className={`transition-all duration-300 ease-in-out overflow-hidden motion-reduce:transition-none ${
                          isOpen ? 'max-h-96 mt-4 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Section */}
        <div className="bg-[#F8FAF8] border border-gray-100 p-8 rounded-2xl text-center mt-16 flex flex-col items-center gap-4">
          <p className="text-gray-500 font-semibold text-sm">Still have questions?</p>
          <Link 
            to="/contact" 
            className="inline-flex items-center justify-center bg-[#154D21] hover:bg-[#103B19] text-white px-6 py-3 rounded-lg font-bold text-sm transition-colors duration-200 motion-reduce:transition-none shadow-sm"
          >
            Contact Support
          </Link>
        </div>

      </div>
    </div>
  );
};

