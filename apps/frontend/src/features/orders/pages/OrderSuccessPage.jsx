import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, ShoppingBag, ArrowRight, Home } from 'lucide-react';

export const OrderSuccessPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const orderNumber = state?.orderNumber;
  const orderId = state?.orderId;

  // If someone navigates here directly without placing an order
  if (!orderNumber) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <p className="text-gray-500 mb-6">No order found.</p>
        <Link to="/" className="text-primary-600 hover:underline font-medium">Go Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-16 px-4 text-center">
      {/* Success Animation */}
      <div className="relative inline-flex items-center justify-center mb-8">
        <div className="w-32 h-32 bg-primary-100 rounded-full flex items-center justify-center animate-pulse-slow">
          <div className="w-24 h-24 bg-primary-200 rounded-full flex items-center justify-center">
            <CheckCircle className="w-14 h-14 text-primary-600" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Order Placed!</h1>
      <p className="text-gray-500 text-lg mb-2">
        Thank you for your order. We've received it successfully.
      </p>
      <p className="text-gray-400 text-sm mb-8">
        You'll receive a confirmation soon.
      </p>

      {/* Order Number */}
      <div className="inline-flex items-center bg-primary-50 border border-primary-200 rounded-xl px-6 py-4 mb-8 gap-3">
        <ShoppingBag className="text-primary-600 w-5 h-5" />
        <div className="text-left">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Order Number</p>
          <p className="text-xl font-extrabold text-primary-700 tracking-wide">#{orderNumber}</p>
        </div>
      </div>

      {/* What's Next */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8 text-left">
        <h3 className="font-bold text-gray-900 mb-4">What happens next?</h3>
        <div className="space-y-3">
          {[
            { step: '1', text: 'Your order is being prepared by the seller.' },
            { step: '2', text: 'Delhivery courier will pick it up from the seller.' },
            { step: '3', text: 'You\'ll receive tracking details when shipped.' },
            { step: '4', text: 'Estimated delivery: 2–5 business days.' },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {step}
              </div>
              <p className="text-sm text-gray-600">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => navigate('/products')}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
        >
          Continue Shopping <ArrowRight size={18} />
        </button>
        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-200 transition-colors"
        >
          <Home size={18} /> Go Home
        </button>
      </div>
    </div>
  );
};
