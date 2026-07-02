import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileUpload } from './FileUpload.jsx';
import { useApplySeller } from '../hooks/useSellerQueries.js';
import { toast } from 'sonner';
import { Loader2, SendHorizonal, ShieldCheck } from 'lucide-react';

const schema = z.object({
  bio: z.string().max(500, 'Bio must be 500 characters or less.').optional(),
  idProof: z.any().refine((f) => f instanceof File, 'ID Proof is required.'),
  addressProof: z.any().refine((f) => f instanceof File, 'Address Proof is required.'),
  shopImage: z.any().optional(),
  fssaiLicense: z.any().optional(),
});

export const SellerApplicationForm = () => {
  const { mutate: apply, isPending } = useApplySeller();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      bio: '',
      idProof: null,
      addressProof: null,
      shopImage: null,
      fssaiLicense: null,
    },
  });

  const onSubmit = (data) => {
    const formData = new FormData();
    if (data.bio) formData.append('bio', data.bio);
    formData.append('idProof', data.idProof);
    formData.append('addressProof', data.addressProof);
    if (data.shopImage instanceof File) formData.append('shopImage', data.shopImage);
    if (data.fssaiLicense instanceof File) formData.append('fssaiLicense', data.fssaiLicense);

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

  const bioValue = watch('bio') || '';

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-[#1E3A2B] rounded-2xl flex items-center justify-center mx-auto mb-5">
          <ShieldCheck size={32} className="text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Seller Application</h1>
        <p className="text-gray-500 text-base max-w-md mx-auto">
          Please provide your information and upload the required documents. Our team will review your application within 24–48 hours.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

        {/* Bio Section */}
        <div className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-1">About You</h2>
          <p className="text-sm text-gray-400 mb-5">Tell customers and our team a little about yourself or your business.</p>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Bio <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              {...register('bio')}
              rows={4}
              placeholder="e.g. I'm a home baker from Kochi, specialising in traditional Kerala sweets and snacks..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 resize-none outline-none focus:border-[#1E3A2B] focus:ring-1 focus:ring-[#1E3A2B]/30 transition-colors"
            />
            <div className="flex justify-between mt-1.5">
              {errors.bio ? (
                <p className="text-xs text-red-500">{errors.bio.message}</p>
              ) : <span />}
              <p className={`text-xs ${bioValue.length > 450 ? 'text-orange-500' : 'text-gray-400'}`}>
                {bioValue.length}/500
              </p>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-1">KYC Documents</h2>
          <p className="text-sm text-gray-400 mb-6">Upload clear, readable copies. Accepted formats: JPG, PNG, WebP, PDF (max 5MB each).</p>

          <div className="space-y-6">
            <Controller
              name="idProof"
              control={control}
              render={({ field }) => (
                <FileUpload
                  label="ID Proof"
                  required
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.idProof?.message}
                />
              )}
            />

            <Controller
              name="addressProof"
              control={control}
              render={({ field }) => (
                <FileUpload
                  label="Address Proof"
                  required
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.addressProof?.message}
                />
              )}
            />

            <Controller
              name="shopImage"
              control={control}
              render={({ field }) => (
                <FileUpload
                  label="Shop / Business Photo"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.shopImage?.message}
                />
              )}
            />

            <Controller
              name="fssaiLicense"
              control={control}
              render={({ field }) => (
                <FileUpload
                  label="FSSAI License"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.fssaiLicense?.message}
                />
              )}
            />
          </div>
        </div>

        {/* Notice */}
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <ShieldCheck size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700 leading-relaxed">
            Your documents are stored securely and are only used for verification purposes. We follow strict data privacy practices and never share your data with third parties.
          </p>
        </div>

        {/* Submit */}
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
      </form>
    </div>
  );
};
