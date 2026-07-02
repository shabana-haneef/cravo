import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-[#F8FAF8] border-t border-gray-100 pt-16 pb-8">
      {/* Footer contents wrapper */}
      <div className="max-w-[1536px] w-full px-4 sm:px-6 lg:px-8 mx-auto">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          
          {/* Column 1: About Cravo */}
          <div>
            <h3 className="text-[#154D21] font-bold text-sm tracking-wider uppercase mb-6">
              About Cravo
            </h3>
            <ul className="flex flex-col gap-4">
              <li>
                <Link 
                  to="/" 
                  onClick={(e) => {
                    if (window.location.pathname === '/') {
                      e.preventDefault();
                      const hero = document.getElementById('hero');
                      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                      const behavior = prefersReducedMotion ? 'auto' : 'smooth';
                      if (hero) {
                        hero.scrollIntoView({ behavior });
                      } else {
                        window.scrollTo({ top: 0, behavior });
                      }
                    }
                  }}
                  className="text-gray-600 hover:text-[#154D21] transition-colors duration-200 motion-reduce:transition-none text-sm font-semibold"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-gray-600 hover:text-[#154D21] transition-colors duration-200 motion-reduce:transition-none text-sm font-semibold">
                  Shop
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-600 hover:text-[#154D21] transition-colors duration-200 motion-reduce:transition-none text-sm font-semibold">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-600 hover:text-[#154D21] transition-colors duration-200 motion-reduce:transition-none text-sm font-semibold">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Customer Care */}
          <div>
            <h3 className="text-[#154D21] font-bold text-sm tracking-wider uppercase mb-6">
              Customer Care
            </h3>
            <ul className="flex flex-col gap-4">
              <li>
                <Link to="/help" className="text-gray-600 hover:text-[#154D21] transition-colors duration-200 motion-reduce:transition-none text-sm font-semibold">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-600 hover:text-[#154D21] transition-colors duration-200 motion-reduce:transition-none text-sm font-semibold">
                  FAQs
                </Link>
              </li>
              <li>
                <Link to="/shipping-policy" className="text-gray-600 hover:text-[#154D21] transition-colors duration-200 motion-reduce:transition-none text-sm font-semibold">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="text-gray-600 hover:text-[#154D21] transition-colors duration-200 motion-reduce:transition-none text-sm font-semibold">
                  Refund & Return Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div>
            <h3 className="text-[#154D21] font-bold text-sm tracking-wider uppercase mb-6">
              Legal
            </h3>
            <ul className="flex flex-col gap-4">
              <li>
                <Link to="/privacy" className="text-gray-600 hover:text-[#154D21] transition-colors duration-200 motion-reduce:transition-none text-sm font-semibold">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-600 hover:text-[#154D21] transition-colors duration-200 motion-reduce:transition-none text-sm font-semibold">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/seller-terms" className="text-gray-600 hover:text-[#154D21] transition-colors duration-200 motion-reduce:transition-none text-sm font-semibold">
                  Seller Terms
                </Link>
              </li>
              <li>
                <Link to="/track-order" className="text-gray-600 hover:text-[#154D21] transition-colors duration-200 motion-reduce:transition-none text-sm font-semibold">
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Get In Touch */}
          <div>
            <h3 className="text-[#154D21] font-bold text-sm tracking-wider uppercase mb-6">
              Get In Touch
            </h3>
            <div className="flex flex-col gap-6">
              {/* Email section */}
              <div className="flex items-center gap-4">
                <div className="text-[#154D21] shrink-0">
                  <Mail size={24} className="stroke-[1.5]" />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-gray-400 text-[10px] font-bold tracking-wider uppercase">
                    Email Us
                  </span>
                  <a 
                    href="mailto:cravofoods10@gmail.com" 
                    className="text-gray-700 hover:text-[#154D21] font-semibold text-sm transition-colors duration-200 motion-reduce:transition-none break-all"
                  >
                    cravofoods10@gmail.com
                  </a>
                </div>
              </div>

              {/* Call section */}
              <div className="flex items-center gap-4">
                <div className="text-[#154D21] shrink-0">
                  <Phone size={24} className="stroke-[1.5]" />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-gray-400 text-[10px] font-bold tracking-wider uppercase">
                    Call Us
                  </span>
                  <a 
                    href="tel:+918129490977" 
                    className="text-gray-700 hover:text-[#154D21] font-semibold text-sm transition-colors duration-200 motion-reduce:transition-none"
                  >
                    +91-8129490977
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Divider and Bottom Footer */}
        <div className="border-t border-gray-200/50 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm font-semibold">
            © 2026 CRAVO. All rights reserved.
          </p>
          
          {/* Social media icons */}
          <div className="flex items-center gap-4">
            <a 
              href="https://facebook.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-[#154D21] hover:bg-[#154D21] hover:text-white transition-all duration-200 motion-safe:hover:scale-105 motion-reduce:transition-none shadow-sm"
              aria-label="Facebook"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-[#154D21] hover:bg-[#154D21] hover:text-white transition-all duration-200 motion-safe:hover:scale-105 motion-reduce:transition-none shadow-sm"
              aria-label="Instagram"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
            <a 
              href="https://youtube.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-[#154D21] hover:bg-[#154D21] hover:text-white transition-all duration-200 motion-safe:hover:scale-105 motion-reduce:transition-none shadow-sm"
              aria-label="YouTube"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
