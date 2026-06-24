import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../../lib/axios.js';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAddresses, useCreateAddress, useUpdateAddress } from '../../users/hooks/useAddressQueries.js';
import { useCheckoutPreview, useCreateOrder, useVerifyPayment } from '../hooks/useOrderQueries.js';
import { useCartStore } from '../../../store/cart.store.js';
import { Button } from '../../../components/ui/Button.jsx';
import { MapPin, Plus, CheckCircle2, CreditCard, Loader2, Pencil, X, ChevronDown } from 'lucide-react';
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

const AddressCard = ({ address, isSelected, onSelect, onEditClick, isEditing }) => (
  <div
    className={`rounded-xl border-2 transition-all ${
      isSelected ? 'border-primary-600 bg-primary-50' : 'border-gray-200 bg-white'
    }`}
  >
    <div
      onClick={() => onSelect(address.id)}
      className="p-4 cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900">{address.fullName}</span>
            <span className="text-sm text-gray-500">• {address.phone}</span>
            {address.isDefault && (
              <span className="text-[10px] font-bold bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">Default</span>
            )}
          </div>
          <p className="text-sm text-gray-600 truncate">
            {address.addressLine1}{address.addressLine2 && `, ${address.addressLine2}`}
          </p>
          <p className="text-sm text-gray-600">{address.city}, {address.state} – {address.postalCode}</p>
        </div>
        <div className="flex items-center gap-2 ml-3 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onEditClick(address); }}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
              isEditing
                ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                : 'bg-gray-100 text-gray-500 hover:bg-primary-100 hover:text-primary-600'
            }`}
            title={isEditing ? 'Cancel edit' : 'Edit address'}
          >
            {isEditing ? <X size={13} /> : <Pencil size={13} />}
          </button>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            isSelected ? 'border-primary-600 bg-primary-600' : 'border-gray-300'
          }`}>
            {isSelected && <CheckCircle2 size={14} className="text-white fill-white" />}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const FIELDS = [
  { name: 'fullName',     label: 'Full Name',              placeholder: 'Shabana Haneef' },
  { name: 'phone',        label: 'Phone Number',           placeholder: '9876543210' },
  { name: 'addressLine1', label: 'Address Line 1',         placeholder: 'House No, Street', colSpan: true },
  { name: 'addressLine2', label: 'Address Line 2 (Optional)', placeholder: 'Landmark',      colSpan: true },
  { name: 'city',         label: 'City',                   placeholder: 'Kozhikode' },
  { name: 'state',        label: 'State',                  placeholder: 'Kerala' },
  { name: 'postalCode',   label: 'PIN Code',               placeholder: '673001' },
  { name: 'country',      label: 'Country',                placeholder: 'India' },
];

const AddressForm = ({ onSuccess, onCancel, defaultValues, isEdit = false, addressId }) => {
  const { mutate: createAddress, isPending: isCreating } = useCreateAddress();
  const { mutate: updateAddress, isPending: isUpdating } = useUpdateAddress();
  const isPending = isCreating || isUpdating;

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: defaultValues || { country: 'India' },
  });

  const onSubmit = (data) => {
    if (isEdit) {
      updateAddress({ id: addressId, data }, {
        onSuccess: () => { toast.success('Address updated'); onSuccess?.(); },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to update address'),
      });
    } else {
      createAddress(data, {
        onSuccess: () => { toast.success('Address added successfully'); onSuccess?.(); },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to save address'),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-3 space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
      <h4 className="font-semibold text-gray-900 text-sm">{isEdit ? 'Edit Address' : 'New Delivery Address'}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FIELDS.map(field => (
          <div key={field.name} className={field.colSpan ? 'sm:col-span-2' : ''}>
            <label className="block text-xs font-medium text-gray-700 mb-1">{field.label}</label>
            <input
              {...register(field.name)}
              placeholder={field.placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
            {errors[field.name] && <p className="text-xs text-red-500 mt-1">{errors[field.name]?.message}</p>}
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1" size="sm">Cancel</Button>
        <Button type="submit" className="flex-1" size="sm" isLoading={isPending}>
          {isEdit ? 'Update' : 'Save Address'}
        </Button>
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

const VISIBLE_COUNT = 2;

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const buyNow = searchParams.get('buyNow') === 'true';
  const variantId = searchParams.get('variantId');
  const quantityParam = searchParams.get('quantity');
  const quantity = quantityParam ? parseInt(quantityParam, 10) : 1;

  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null); // { id, data }
  const [showAll, setShowAll] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [serviceability, setServiceability] = useState({ checked: false, deliverable: false, checking: false, error: null });

  const previewParams = buyNow ? { buyNow: true, variantId, quantity } : {};
  const { 
    data: previewResponse, 
    isLoading: loadingPreview,
    isError: hasPreviewError,
    error: previewError
  } = useCheckoutPreview(previewParams);

  const { data: addressData, isLoading: loadingAddresses } = useAddresses();
  const { mutate: createOrder } = useCreateOrder();
  const { mutate: verifyPayment } = useVerifyPayment();
  const clearCartCount = useCartStore(state => state.clearCartCount);

  const cart = previewResponse?.data?.cart;
  const deliverySummary = previewResponse?.data?.summary;
  const addresses = addressData?.data?.addresses || [];

  useEffect(() => {
    if (!selectedAddressId) {
      setServiceability({ checked: false, deliverable: false, checking: false, error: null });
      return;
    }
    const address = addresses.find(a => a.id === selectedAddressId);
    if (!address?.postalCode) return;

    const checkPincode = async () => {
      try {
        setServiceability(prev => ({ ...prev, checking: true, error: null }));
        const response = await api.get(`/delhivery/serviceability/${address.postalCode}`);
        if (response.data?.success) {
          setServiceability({
            checked: true,
            deliverable: response.data.deliverable,
            checking: false,
            error: null
          });
          if (!response.data.deliverable) {
            toast.error('Selected delivery address is not serviceable by Delhivery.');
          }
        } else {
          throw new Error('Serviceability check failed');
        }
      } catch (err) {
        setServiceability({
          checked: true,
          deliverable: false,
          checking: false,
          error: 'Could not verify delivery serviceability. Please check the address.'
        });
        toast.error('Unable to verify delivery serviceability for this address.');
      }
    };

    checkPincode();
  }, [selectedAddressId, addresses]);

  const handlePayment = async () => {
    if (!selectedAddressId) {
      toast.error('Please select a delivery address');
      return;
    }
    if (serviceability.checking) {
      toast.info('Verifying delivery serviceability, please wait...');
      return;
    }
    if (serviceability.checked && !serviceability.deliverable) {
      toast.error('Selected delivery address is not serviceable by Delhivery. Please choose another address.');
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

    const orderPayload = {
      addressId: selectedAddressId,
      ...(buyNow ? { buyNow: true, variantId, quantity } : {})
    };

    createOrder(orderPayload, {
      onSuccess: (res) => {
        try {
          const order = res?.data?.order;
          const razorpayOrder = res?.data?.payment;

          if (!order || !razorpayOrder) {
            throw new Error("Invalid response from server");
          }

          const paymentKey = razorpayOrder.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
          if (!paymentKey) {
            throw new Error("Payment gateway key is missing. Please check your configuration.");
          }

          const options = {
            key: paymentKey,
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
                  if (!buyNow) {
                    clearCartCount();
                  }
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

  if (loadingPreview) return <CheckoutSkeleton />;

  if (hasPreviewError || !cart) {
    const errorMessage = previewError?.response?.data?.message || 'Failed to load checkout preview. Please check your cart or try again.';
    return (
      <div className="max-w-md mx-auto my-12 text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <X size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Checkout Error</h2>
        <p className="text-gray-600 mb-6">{errorMessage}</p>
        <Button onClick={() => navigate(buyNow ? `/products` : '/cart')} className="w-full">
          {buyNow ? 'Back to Products' : 'Go to Cart'}
        </Button>
      </div>
    );
  }

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
                {[1, 2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
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
              <>
                {/* Address list — show 2 by default, rest in scroll */}
                <div className={`space-y-3 ${ addresses.length > VISIBLE_COUNT && showAll ? 'max-h-[420px] overflow-y-auto pr-1 scrollbar-thin' : '' }`}>
                  {(showAll ? addresses : addresses.slice(0, VISIBLE_COUNT)).map(address => (
                    <div key={address.id}>
                      <AddressCard
                        address={address}
                        isSelected={selectedAddressId === address.id}
                        onSelect={(id) => { setSelectedAddressId(id); setEditingAddress(null); }}
                        isEditing={editingAddress?.id === address.id}
                        onEditClick={(addr) => {
                          if (editingAddress?.id === addr.id) {
                            setEditingAddress(null);
                          } else {
                            setEditingAddress({ id: addr.id, data: addr });
                          }
                        }}
                      />
                      {/* Inline edit form */}
                      {editingAddress?.id === address.id && (
                        <AddressForm
                          isEdit
                          addressId={address.id}
                          defaultValues={{
                            fullName:     address.fullName,
                            phone:        address.phone,
                            addressLine1: address.addressLine1,
                            addressLine2: address.addressLine2 || '',
                            city:         address.city,
                            state:        address.state,
                            postalCode:   address.postalCode,
                            country:      address.country || 'India',
                          }}
                          onSuccess={() => setEditingAddress(null)}
                          onCancel={() => setEditingAddress(null)}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Show more / less toggle */}
                {addresses.length > VISIBLE_COUNT && (
                  <button
                    onClick={() => setShowAll(v => !v)}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium py-2 rounded-lg hover:bg-primary-50 transition-colors"
                  >
                    <ChevronDown size={16} className={`transition-transform duration-200 ${showAll ? 'rotate-180' : ''}`} />
                    {showAll ? 'Show less' : `Show ${addresses.length - VISIBLE_COUNT} more address${addresses.length - VISIBLE_COUNT > 1 ? 'es' : ''}`}
                  </button>
                )}
              </>
            )}

            {/* Serviceability indicator */}
            {selectedAddressId && (
              <div className="mt-3 p-3 rounded-xl border border-dashed flex items-center text-sm transition-all motion-reduce:transition-none">
                {serviceability.checking ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 size={16} className="animate-spin text-primary-600" />
                    <span>Verifying pincode serviceability...</span>
                  </div>
                ) : serviceability.error ? (
                  <div className="text-amber-600 font-medium">⚠️ {serviceability.error}</div>
                ) : serviceability.deliverable ? (
                  <div className="text-green-700 font-semibold flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>Deliverable to pincode {addresses.find(a => a.id === selectedAddressId)?.postalCode} by Delhivery</span>
                  </div>
                ) : (
                  <div className="text-red-500 font-semibold">
                    ⚠️ Selected pincode ({addresses.find(a => a.id === selectedAddressId)?.postalCode}) is not serviceable by Delhivery.
                  </div>
                )}
              </div>
            )}

            {/* New address form */}
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
                  <span className="font-semibold text-[#154D21]">₹{item.totalPrice.toFixed(2)}</span>
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
                <span>Subtotal ({cart?.summary?.totalItems} item{cart?.summary?.totalItems > 1 ? 's' : ''})</span>
                <span className="font-medium text-[#154D21]">₹{deliverySummary?.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Charges</span>
                <span className="font-medium text-[#154D21]">
                  {deliverySummary?.deliveryCharge === 0 ? 'FREE' : `₹${deliverySummary?.deliveryCharge?.toFixed(2)}`}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-extrabold text-[#154D21]">₹{deliverySummary?.grandTotal?.toFixed(2)}</span>
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
                  Pay ₹{deliverySummary?.grandTotal?.toFixed(2)}
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
