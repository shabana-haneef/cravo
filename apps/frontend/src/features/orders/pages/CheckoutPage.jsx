import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCart } from '../../cart/hooks/useCartQueries.js';
import { useAddresses, useCreateAddress } from '../../users/hooks/useAddressQueries.js';
import { useCreateOrder, useVerifyPayment } from '../hooks/useOrderQueries.js';
import { useCartStore } from '../../../store/cart.store.js';
import { Button } from '../../../components/ui/Button.jsx';
import { MapPin, Plus, ChevronRight, CheckCircle2, CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const addressSchema = z.object({
  fullName: z.string().min(2, 'Full name required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number'),
  addressLine1: z.string().min(5, 'Address required'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City required'),
  state: z.string().min(2, 'State required'),
  postalCode: z.string().regex(/^[1-9][0-9]{5}$/, 'Must be a valid 6-digit Indian PIN code'),
  country: z.string().default('India'),
});

const AddressCard = ({ address, isSelected, onSelect }) => (
  <div
    onClick={() => onSelect(address.id)}
    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
      isSelected
        ? 'border-primary-600 bg-primary-50'
        : 'border-gray-200 hover:border-gray-300 bg-white'
    }`}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-gray-900">{address.fullName}</span>
          <span className="text-sm text-gray-500">• {address.phone}</span>
        </div>
        <p className="text-sm text-gray-600">
          {address.addressLine1}
          {address.addressLine2 && `, ${address.addressLine2}`}
        </p>
        <p className="text-sm text-gray-600">
          {address.city}, {address.state} – {address.postalCode}
        </p>
      </div>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
        isSelected ? 'border-primary-600 bg-primary-600' : 'border-gray-300'
      }`}>
        {isSelected && <CheckCircle2 size={14} className="text-white fill-white" />}
      </div>
    </div>
  </div>
);

const AddressForm = ({ onSuccess, onCancel }) => {
  const { mutate: createAddress, isPending } = useCreateAddress();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: { country: 'India' },
  });

  const onSubmit = (data) => {
    createAddress(data, {
      onSuccess: () => {
        toast.success('Address added successfully');
        onSuccess?.();
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to save address'),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
      <h4 className="font-semibold text-gray-900">New Delivery Address</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { name: 'fullName', label: 'Full Name', placeholder: 'Javid Khan' },
          { name: 'phone', label: 'Phone Number', placeholder: '9876543210' },
          { name: 'addressLine1', label: 'Address Line 1', placeholder: 'House No, Street', colSpan: true },
          { name: 'addressLine2', label: 'Address Line 2 (Optional)', placeholder: 'Landmark', colSpan: true },
          { name: 'city', label: 'City', placeholder: 'Kozhikode' },
          { name: 'state', label: 'State', placeholder: 'Kerala' },
          { name: 'postalCode', label: 'PIN Code', placeholder: '673001' },
          { name: 'country', label: 'Country', placeholder: 'India' },
        ].map(field => (
          <div key={field.name} className={field.colSpan ? 'sm:col-span-2' : ''}>
            <label className="block text-xs font-medium text-gray-700 mb-1">{field.label}</label>
            <input
              {...register(field.name)}
              placeholder={field.placeholder}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
            {errors[field.name] && (
              <p className="text-xs text-red-500 mt-1">{errors[field.name]?.message}</p>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" className="flex-1" isLoading={isPending}>Save Address</Button>
      </div>
    </form>
  );
};

const loadRazorpay = () => {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-sdk')) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-sdk';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: cartData } = useCart();
  const { data: addressData, isLoading: loadingAddresses } = useAddresses();
  const { mutate: createOrder } = useCreateOrder();
  const { mutate: verifyPayment } = useVerifyPayment();
  const clearCartCount = useCartStore(state => state.clearCartCount);

  const cart = cartData?.data?.cart;
  const addresses = addressData?.data?.addresses || [];
  const summary = cart?.summary;

  const handlePayment = async () => {
    if (!selectedAddressId) {
      toast.error('Please select a delivery address');
      return;
    }
    if (!cart || cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    setIsProcessing(true);

    const sdkLoaded = await loadRazorpay();
    if (!sdkLoaded) {
      toast.error('Payment gateway failed to load. Please try again.');
      setIsProcessing(false);
      return;
    }

    createOrder({ addressId: selectedAddressId }, {
      onSuccess: (res) => {
        try {
          const order = res?.data?.order;
          const razorpayOrder = res?.data?.payment;

          if (!order || !razorpayOrder) {
            throw new Error("Invalid response from server");
          }

          const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            name: 'Cravo',
            description: `Order #${order.orderNumber}`,
            order_id: razorpayOrder.razorpayOrderId,
            handler: (paymentResponse) => {
              verifyPayment({
                razorpayOrderId: paymentResponse.razorpay_order_id,
                razorpayPaymentId: paymentResponse.razorpay_payment_id,
                razorpaySignature: paymentResponse.razorpay_signature,
              }, {
                onSuccess: () => {
                  clearCartCount();
                  toast.success('Payment successful!');
                  navigate('/orders/success', {
                    replace: true,
                    state: { orderNumber: order.orderNumber, orderId: order.id }
                  });
                },
                onError: () => {
                  toast.error('Payment verification failed. Please contact support.');
                  setIsProcessing(false);
                }
              });
            },
            prefill: {
              name: addresses.find(a => a.id === selectedAddressId)?.fullName,
              contact: addresses.find(a => a.id === selectedAddressId)?.phone,
            },
            theme: { color: '#16a34a' },
            modal: {
              ondismiss: () => {
                toast.error('Payment cancelled');
                setIsProcessing(false);
              }
            }
          };

          const rzp = new window.Razorpay(options);
          rzp.on('payment.failed', () => {
            toast.error('Payment failed. Please try again.');
            setIsProcessing(false);
          });
          rzp.open();
        } catch (err) {
          toast.error('Payment initialization failed. Please try again.');
          setIsProcessing(false);
        }
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Failed to create order');
        setIsProcessing(false);
      }
    });
  };

  const CheckoutSkeleton = () => (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 bg-gray-200 rounded"></div>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-4">
          <div className="h-48 bg-gray-100 rounded-2xl"></div>
          <div className="h-40 bg-gray-100 rounded-2xl"></div>
        </div>
        <div className="w-full lg:w-96 h-80 bg-gray-100 rounded-2xl"></div>
      </div>
    </div>
  );

  if (!cart) return <CheckoutSkeleton />;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-8">Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column */}
        <div className="flex-1 space-y-6">
          
          {/* Address Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900 flex items-center">
                <MapPin size={20} className="mr-2 text-primary-600" />
                Delivery Address
              </h2>
              {!showAddressForm && (
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center transition-colors"
                >
                  <Plus size={16} className="mr-1" /> Add New
                </button>
              )}
            </div>

            {loadingAddresses ? (
              <div className="space-y-3">
                {[1, 2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse"></div>)}
              </div>
            ) : addresses.length === 0 && !showAddressForm ? (
              <div className="text-center py-8">
                <MapPin size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 mb-4">No saved addresses yet</p>
                <Button onClick={() => setShowAddressForm(true)} variant="outline" size="sm">
                  <Plus size={16} className="mr-1" /> Add Delivery Address
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map(address => (
                  <AddressCard
                    key={address.id}
                    address={address}
                    isSelected={selectedAddressId === address.id}
                    onSelect={setSelectedAddressId}
                  />
                ))}
              </div>
            )}

            {showAddressForm && (
              <AddressForm
                onSuccess={() => setShowAddressForm(false)}
                onCancel={() => setShowAddressForm(false)}
              />
            )}
          </div>

          {/* Items Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Order Items</h2>
            <div className="space-y-4">
              {cart.items.map(item => (
                <div key={item.id} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    <p className="text-sm text-gray-500">{item.variantName} × {item.quantity}</p>
                  </div>
                  <span className="font-semibold text-gray-900">₹{item.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="w-full lg:w-96 shrink-0">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Payment Summary</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({summary.totalItems} items)</span>
                <span className="font-medium text-gray-900">₹{summary.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Charges</span>
                <span className="text-sm text-gray-500">Calculated by backend</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-extrabold text-primary-600">₹{summary.estimatedTotal.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Final amount calculated securely at payment</p>
            </div>

            <Button
              className="w-full h-14 text-lg"
              onClick={handlePayment}
              disabled={isProcessing || !selectedAddressId}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={20} className="mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard size={20} className="mr-2" />
                  Pay ₹{summary.estimatedTotal.toFixed(2)}
                </>
              )}
            </Button>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Secured by Razorpay
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
