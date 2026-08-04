import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileUpload } from './FileUpload.jsx';
import { useApplySeller } from '../hooks/useSellerQueries.js';
import { toast } from 'sonner';
import { Loader2, SendHorizonal, ShieldCheck, ChevronRight, ChevronLeft, Store, CreditCard, FileText } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store.js';

// Schema Validation
const schema = z.object({
  // Step 1: Basic Info
  fullName: z.string().min(1, 'Full Name is required'),
  mobileNumber: z.string().min(10, 'Valid Mobile Number is required'),
  profilePhoto: z.any().optional(),

  // Step 2: Business Info
  businessName: z.string().min(1, 'Business Name is required'),
  businessType: z.string().min(1, 'Business Type is required'),
  fssaiNumber: z.string().optional(),
  fssaiLicense: z.any().optional(),

  // Step 3: Business Address
  businessAddressLine1: z.string().min(1, 'Address Line 1 is required'),
  businessAddressLine2: z.string().optional(),
  businessCity: z.string().min(1, 'City is required'),
  businessState: z.string().min(1, 'State is required'),
  businessPincode: z.string().min(5, 'Postal Code is required'),
  businessCountry: z.string().default('India'),

  // Step 4: Pickup/Warehouse
  pickupLocationName: z.string().optional(),
  pickupAddress: z.string().min(1, 'Pickup Address is required'),
  pickupCity: z.string().min(1, 'Pickup City is required'),
  pickupState: z.string().min(1, 'Pickup State is required'),
  pickupPincode: z.string().min(5, 'Pickup Postal Code is required'),

  // Step 5: Bank Details
  accountHolderName: z.string().min(1, 'Account Holder Name is required'),
  bankName: z.string().min(1, 'Bank Name is required'),
  accountNumber: z.string().min(1, 'Account Number is required'),
  ifsc: z.string().min(1, 'IFSC Code is required'),
  branchName: z.string().min(1, 'Branch Name is required'),

  // Step 6: Store Info
  storeName: z.string().min(1, 'Store Name is required'),
  storeDescription: z.string().optional(),
  storeWebsite: z.string().optional(),
  shopLogo: z.any().optional(),
  shopBanner: z.any().optional(),

  // Step 7: Contact Info
  supportEmail: z.string().email('Invalid support email').optional().or(z.literal('')),
  supportPhone: z.string().optional(),

  // Step 8: KYC & Agreements
  idProof: z.any().refine((f) => f instanceof File, 'ID Proof (Image) is required.'),
  acceptTerms: z.boolean().refine((v) => v === true, 'You must accept the terms.'),
});

export const SellerApplicationForm = () => {
  const { user } = useAuthStore();
  const { mutate: apply, isPending } = useApplySeller();
  const [step, setStep] = useState(1);
  const totalSteps = 6;

  const {
    register,
    handleSubmit,
    control,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: user?.profile?.fullName || '',
      mobileNumber: user?.profile?.phone || '',
      businessName: '',
      businessType: '',
      fssaiNumber: '',
      businessAddressLine1: '',
      businessAddressLine2: '',
      businessCity: '',
      businessState: '',
      businessPincode: '',
      businessCountry: 'India',
      pickupLocationName: '',
      pickupAddress: '',
      pickupCity: '',
      pickupState: '',
      pickupPincode: '',
      accountHolderName: '',
      bankName: '',
      accountNumber: '',
      ifsc: '',
      branchName: '',
      storeName: '',
      storeDescription: '',
      storeWebsite: '',
      supportEmail: '',
      supportPhone: '',
      acceptTerms: false,
    },
  });

  const nextStep = async () => {
    let fieldsToValidate = [];
    if (step === 1) fieldsToValidate = ['fullName', 'mobileNumber'];
    if (step === 2) fieldsToValidate = ['businessName', 'businessType', 'businessAddressLine1', 'businessCity', 'businessState', 'businessPincode'];
    if (step === 3) fieldsToValidate = ['pickupAddress', 'pickupCity', 'pickupState', 'pickupPincode'];
    if (step === 4) fieldsToValidate = ['accountHolderName', 'bankName', 'accountNumber', 'ifsc', 'branchName'];
    if (step === 5) fieldsToValidate = ['storeName'];
    
    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) {
      setStep((s) => Math.min(s + 1, totalSteps));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast.error("Please fill all required fields correctly.");
    }
  };

  const prevStep = () => {
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = (data) => {
    const formData = new FormData();
    
    // Append Text Fields
    Object.keys(data).forEach(key => {
      if (data[key] && !(data[key] instanceof File) && typeof data[key] === 'string') {
        formData.append(key, data[key]);
      }
    });

    // Append File Fields
    if (data.profilePhoto instanceof File) formData.append('profilePhoto', data.profilePhoto);
    if (data.idProof instanceof File) formData.append('idProof', data.idProof);
    if (data.fssaiLicense instanceof File) formData.append('fssaiLicense', data.fssaiLicense);
    if (data.shopLogo instanceof File) formData.append('shopLogo', data.shopLogo);
    if (data.shopBanner instanceof File) formData.append('shopBanner', data.shopBanner);

    apply(formData, {
      onSuccess: () => {
        toast.success('Application submitted! We will review it within 24–48 hours.');
      },
      onError: (err) => {
        const message = err.response?.data?.message || 'Failed to submit. Please try again.';
        toast.error(message);
      },
    });
  };

  return (
    <div className="max-w-3xl mx-auto pb-10">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-[#1E3A2B] rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Store size={32} className="text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Seller Application</h1>
        <p className="text-gray-500 text-base max-w-md mx-auto">
          Complete the form below to become a verified seller on Cravo.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8 relative">
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-gray-200">
          <div style={{ width: `${(step / totalSteps) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#1E3A2B] transition-all duration-300"></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 font-medium px-1">
          <span>Step {step} of {totalSteps}</span>
          <span>{Math.round((step / totalSteps) * 100)}% Completed</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

        {/* STEP 1: Basic Info */}
        {step === 1 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-6">1. Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                <input {...register('fullName')} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#1E3A2B]" />
                {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address (Read-Only)</label>
                <input value={user?.email || ''} readOnly className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none bg-gray-50 text-gray-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number *</label>
                <input {...register('mobileNumber')} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#1E3A2B]" />
                {errors.mobileNumber && <p className="text-xs text-red-500 mt-1">{errors.mobileNumber.message}</p>}
              </div>
              <div className="col-span-1 md:col-span-2">
                <Controller
                  name="profilePhoto"
                  control={control}
                  render={({ field }) => (
                    <FileUpload label="Profile Photo (Optional - JPG/PNG)" value={field.value} onChange={field.onChange} />
                  )}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Business & Address Info */}
        {step === 2 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm space-y-8">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-6">2. Business Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Business Name *</label>
                  <input {...register('businessName')} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#1E3A2B]" />
                  {errors.businessName && <p className="text-xs text-red-500 mt-1">{errors.businessName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Business Type *</label>
                  <select {...register('businessType')} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#1E3A2B] bg-white">
                    <option value="">Select Type</option>
                    <option value="Sole Proprietorship">Sole Proprietorship</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Private Limited">Private Limited</option>
                    <option value="Farmer">Farmer / Agriculture</option>
                    <option value="Home Business">Home Business</option>
                  </select>
                  {errors.businessType && <p className="text-xs text-red-500 mt-1">{errors.businessType.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">FSSAI Number (Optional)</label>
                  <input {...register('fssaiNumber')} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#1E3A2B]" />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <Controller
                    name="fssaiLicense"
                    control={control}
                    render={({ field }) => (
                      <FileUpload label="FSSAI License Image (Optional)" value={field.value} onChange={field.onChange} />
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Business Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 1 *</label>
                  <input {...register('businessAddressLine1')} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#1E3A2B]" />
                  {errors.businessAddressLine1 && <p className="text-xs text-red-500 mt-1">{errors.businessAddressLine1.message}</p>}
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 2 (Optional)</label>
                  <input {...register('businessAddressLine2')} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#1E3A2B]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">City *</label>
                  <input {...register('businessCity')} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#1E3A2B]" />
                  {errors.businessCity && <p className="text-xs text-red-500 mt-1">{errors.businessCity.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">State *</label>
                  <input {...register('businessState')} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#1E3A2B]" />
                  {errors.businessState && <p className="text-xs text-red-500 mt-1">{errors.businessState.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Postal Code *</label>
                  <input {...register('businessPincode')} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#1E3A2B]" />
                  {errors.businessPincode && <p className="text-xs text-red-500 mt-1">{errors.businessPincode.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                  <input {...register('businessCountry')} readOnly className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none bg-gray-50 text-gray-500" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Pickup Address */}
        {step === 3 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-6">3. Pickup/Warehouse Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Warehouse Name (Optional)</label>
                <input {...register('pickupLocationName')} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#1E3A2B]" />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Pickup Address *</label>
                <input {...register('pickupAddress')} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#1E3A2B]" />
                {errors.pickupAddress && <p className="text-xs text-red-500 mt-1">{errors.pickupAddress.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">City *</label>
                <input {...register('pickupCity')} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#1E3A2B]" />
                {errors.pickupCity && <p className="text-xs text-red-500 mt-1">{errors.pickupCity.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">State *</label>
                <input {...register('pickupState')} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#1E3A2B]" />
                {errors.pickupState && <p className="text-xs text-red-500 mt-1">{errors.pickupState.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Postal Code *</label>
                <input {...register('pickupPincode')} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#1E3A2B]" />
                {errors.pickupPincode && <p className="text-xs text-red-500 mt-1">{errors.pickupPincode.message}</p>}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Bank Details */}
        {step === 4 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              <CreditCard size={24} className="text-[#1E3A2B]" />
              4. Bank Details
            </h2>
            <p className="text-sm text-gray-400 mb-6">For secure payouts of your sales.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Account Holder Name *</label>
                <input {...register('accountHolderName')} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#1E3A2B]" />
                {errors.accountHolderName && <p className="text-xs text-red-500 mt-1">{errors.accountHolderName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Name *</label>
                <input {...register('bankName')} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#1E3A2B]" />
                {errors.bankName && <p className="text-xs text-red-500 mt-1">{errors.bankName.message}</p>}
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Account Number *</label>
                <input {...register('accountNumber')} type="password" placeholder="Enter Account Number" className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#1E3A2B] mb-3" />
                <input {...register('accountNumber')} placeholder="Confirm Account Number" className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#1E3A2B]" />
                {errors.accountNumber && <p className="text-xs text-red-500 mt-1">{errors.accountNumber.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">IFSC Code *</label>
                <input {...register('ifsc')} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#1E3A2B] uppercase" />
                {errors.ifsc && <p className="text-xs text-red-500 mt-1">{errors.ifsc.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Branch Name *</label>
                <input {...register('branchName')} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#1E3A2B]" />
                {errors.branchName && <p className="text-xs text-red-500 mt-1">{errors.branchName.message}</p>}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Store Info */}
        {step === 5 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-6">5. Store Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Store Name *</label>
                <input {...register('storeName')} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#1E3A2B]" />
                {errors.storeName && <p className="text-xs text-red-500 mt-1">{errors.storeName.message}</p>}
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Store Description / Bio</label>
                <textarea {...register('storeDescription')} rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#1E3A2B] resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Support Email (Optional)</label>
                <input {...register('supportEmail')} type="email" className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#1E3A2B]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Support Phone (Optional)</label>
                <input {...register('supportPhone')} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#1E3A2B]" />
              </div>
              <div className="col-span-1 md:col-span-2">
                <Controller
                  name="shopLogo"
                  control={control}
                  render={({ field }) => (
                    <FileUpload label="Store Logo (Image)" value={field.value} onChange={field.onChange} />
                  )}
                />
              </div>
              <div className="col-span-1 md:col-span-2">
                <Controller
                  name="shopBanner"
                  control={control}
                  render={({ field }) => (
                    <FileUpload label="Store Banner (Image)" value={field.value} onChange={field.onChange} />
                  )}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: KYC & Submit */}
        {step === 6 && (
          <div className="space-y-8">
            <div className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm">
              <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <FileText size={24} className="text-[#1E3A2B]" />
                6. Identity Verification (KYC)
              </h2>
              <p className="text-sm text-gray-400 mb-6">Upload a clear photo of your ID proof.</p>
              
              <Controller
                name="idProof"
                control={control}
                render={({ field }) => (
                  <FileUpload label="ID Proof (Image format only)" required value={field.value} onChange={field.onChange} error={errors.idProof?.message} />
                )}
              />
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Agreements</h2>
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" {...register('acceptTerms')} className="mt-1 w-5 h-5 rounded border-gray-300 text-[#1E3A2B] focus:ring-[#1E3A2B]" />
                  <span className="text-sm text-gray-700 leading-relaxed">
                    I accept the Terms & Conditions, Seller Agreement, and Privacy Policy Consent. I declare that the information provided is accurate and authentic.
                  </span>
                </label>
                {errors.acceptTerms && <p className="text-xs text-red-500">{errors.acceptTerms.message}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-3 bg-[#1E3A2B] text-white font-bold py-4 rounded-full text-base hover:bg-[#162A1F] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#1E3A2B]/20"
            >
              {isPending ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Submitting Application...
                </>
              ) : (
                <>
                  <SendHorizonal size={20} />
                  Submit Application
                </>
              )}
            </button>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-4">
          {step > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-gray-300 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={18} />
              Back
            </button>
          )}
          <div className="flex-1"></div>
          {step < totalSteps && (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1E3A2B] text-white font-medium hover:bg-[#162A1F] transition-colors"
            >
              Next Step
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
