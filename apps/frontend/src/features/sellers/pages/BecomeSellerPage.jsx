import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Store, ShieldCheck, TrendingUp, Zap, Users, 
  PackageCheck, ChevronRight, Star, Award, Leaf,
  Fish, Cake, Soup, Carrot
} from 'lucide-react';

const benefits = [
  {
    icon: <Store size={28} className="text-[#1E3A2B]" />,
    title: 'Your Own Digital Storefront',
    desc: 'Create a beautiful shop profile, showcase your products, and reach customers in your neighbourhood.',
  },
  {
    icon: <TrendingUp size={28} className="text-[#1E3A2B]" />,
    title: 'Grow Your Revenue',
    desc: 'Tap into a growing local marketplace. More visibility, more orders, more income every day.',
  },
  {
    icon: <ShieldCheck size={28} className="text-[#1E3A2B]" />,
    title: 'Secure & Trusted',
    desc: 'Get verified with Cravo KYC and build trust with customers. We handle payments securely.',
  },
  {
    icon: <Zap size={28} className="text-[#1E3A2B]" />,
    title: 'Easy Order Management',
    desc: 'Manage orders, inventory, and deliveries from one simple seller dashboard.',
  },
  {
    icon: <Users size={28} className="text-[#1E3A2B]" />,
    title: 'Loyal Customer Base',
    desc: 'Connect with buyers who prefer shopping local. Build repeat business through Cravo.',
  },
  {
    icon: <PackageCheck size={28} className="text-[#1E3A2B]" />,
    title: 'Quick Onboarding',
    desc: 'Apply in minutes. Upload your documents, get approved, and start selling right away.',
  },
];

const sellerTypes = [
  { icon: <Leaf size={20} />, label: 'Farmers' },
  { icon: <Cake size={20} />, label: 'Bakers' },
  { icon: <Fish size={20} />, label: 'Fish Sellers' },
  { icon: <Carrot size={20} />, label: 'Vegetable Sellers' },
  { icon: <Soup size={20} />, label: 'Home Food Makers' },
  { icon: <Store size={20} />, label: 'Local Shops' },
];

const stats = [
  { value: '500+', label: 'Active Sellers' },
  { value: '10K+', label: 'Happy Customers' },
  { value: '₹2Cr+', label: 'Sales Processed' },
  { value: '4.8★', label: 'Average Rating' },
];

export const BecomeSellerPage = () => {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1E3A2B] via-[#2a4f3c] to-[#1E3A2B]">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full border-4 border-white"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full border-4 border-white"></div>
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full border-2 border-white"></div>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-8">
            <Award size={16} className="text-[#B88645]" />
            <span className="text-white text-sm font-medium">Join Kerala's Fastest-Growing Local Marketplace</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6">
            Sell What You Make,<br />
            <span className="text-[#B88645]">Reach Who Matters</span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            Whether you're a farmer, baker, or home food maker — Cravo gives you the platform to turn your passion into profit. Apply in minutes and start selling to your local community.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/seller/application"
              className="inline-flex items-center gap-2 bg-[#B88645] text-white font-bold px-8 py-4 rounded-full text-lg hover:bg-[#a0743a] transition-colors shadow-lg shadow-[#B88645]/30"
            >
              Start Selling Now
              <ChevronRight size={20} />
            </Link>
            <a href="#how-it-works" className="text-white/70 hover:text-white font-medium transition-colors flex items-center gap-1">
              See how it works
            </a>
          </div>

          {/* Seller type pills */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
            {sellerTypes.map((type) => (
              <div key={type.label} className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2">
                <span className="text-[#B88645]">{type.icon}</span>
                <span className="text-white text-sm font-medium">{type.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#F9F6F0] border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-extrabold text-[#1E3A2B] mb-1">{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-[#B88645] uppercase tracking-widest mb-2">Why Cravo?</p>
          <h2 className="text-3xl font-extrabold text-gray-900">Everything You Need to Succeed</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((b) => (
            <div key={b.title} className="bg-white border border-gray-100 rounded-2xl p-7 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-[#F0F8F3] rounded-xl flex items-center justify-center mb-5">
                {b.icon}
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">{b.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-[#F9F6F0] py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#B88645] uppercase tracking-widest mb-2">Process</p>
            <h2 className="text-3xl font-extrabold text-gray-900">Start Selling in 3 Simple Steps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Apply Online', desc: 'Fill out a short form with your bio and upload your KYC documents.' },
              { step: '02', title: 'Get Verified', desc: "Our team reviews your application within 24–48 hours and verifies your identity." },
              { step: '03', title: 'Start Selling', desc: 'Once approved, create your shop, add products, and start receiving orders immediately.' },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="w-16 h-16 rounded-full bg-[#1E3A2B] text-white text-2xl font-extrabold flex items-center justify-center mx-auto mb-5">
                  {item.step}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="max-w-3xl mx-auto px-4 py-20 text-center">
        <Star size={32} className="text-yellow-400 mx-auto mb-6 fill-yellow-400" />
        <blockquote className="text-xl md:text-2xl font-semibold text-gray-800 leading-relaxed mb-6">
          "Cravo helped me reach 3x more customers in my area within the first month. The setup was incredibly easy!"
        </blockquote>
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#1E3A2B] flex items-center justify-center text-white font-bold text-lg">R</div>
          <div className="text-left">
            <p className="font-bold text-gray-900">Raveena Thomas</p>
            <p className="text-sm text-gray-500">Home Baker, Kochi</p>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="bg-gradient-to-r from-[#1E3A2B] to-[#2a4f3c] py-16 text-center">
        <h2 className="text-3xl font-extrabold text-white mb-4">Ready to Start Your Journey?</h2>
        <p className="text-white/70 mb-8 max-w-md mx-auto">Join hundreds of local sellers already growing with Cravo. Apply today — it's free.</p>
        <Link
          to="/seller/application"
          className="inline-flex items-center gap-2 bg-[#B88645] text-white font-bold px-10 py-4 rounded-full text-lg hover:bg-[#a0743a] transition-colors shadow-lg"
        >
          Apply Now — It's Free
          <ChevronRight size={20} />
        </Link>
      </section>
    </div>
  );
};
