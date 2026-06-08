import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addressSchema } from '../schemas/user.schemas.js';
import { Button } from '../../../components/ui/Button.jsx';
import { Home, Briefcase, MapPin } from 'lucide-react';

const LABELS = [
  { value: 'HOME', label: 'Home', icon: Home },
  { value: 'OFFICE', label: 'Office', icon: Briefcase },
  { value: 'OTHER', label: 'Other', icon: MapPin },
];

const FormField = ({ label, error, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">{label}</label>
    {children}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

const inputClass = (hasError) =>
  `w-full px-3.5 py-2.5 border rounded-lg text-sm outline-none transition-all ${
    hasError
      ? 'border-red-400 focus:ring-2 focus:ring-red-200'
      : 'border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100'
  }`;

export const AddressForm = ({ defaultValues, onSubmit, isPending, onCancel }) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: 'HOME',
      isDefault: false,
      ...defaultValues,
    },
  });

  const selectedLabel = watch('label');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Label Selection */}
      <FormField label="Address Type">
        <div className="flex gap-3">
          {LABELS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setValue('label', value)}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                selectedLabel === value
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
      </FormField>

      {/* Name & Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Full Name" error={errors.fullName?.message}>
          <input {...register('fullName')} placeholder="Javid Khan" className={inputClass(errors.fullName)} />
        </FormField>
        <FormField label="Phone Number" error={errors.phone?.message}>
          <input {...register('phone')} placeholder="9876543210" className={inputClass(errors.phone)} />
        </FormField>
      </div>

      {/* Address Lines */}
      <FormField label="Address Line 1" error={errors.addressLine1?.message}>
        <input {...register('addressLine1')} placeholder="House no, Building, Street" className={inputClass(errors.addressLine1)} />
      </FormField>
      <FormField label="Address Line 2 (Optional)" error={errors.addressLine2?.message}>
        <input {...register('addressLine2')} placeholder="Landmark, Area" className={inputClass(errors.addressLine2)} />
      </FormField>

      {/* City, District, State, PIN */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <FormField label="City" error={errors.city?.message}>
          <input {...register('city')} placeholder="Kozhikode" className={inputClass(errors.city)} />
        </FormField>
        <FormField label="District" error={errors.district?.message}>
          <input {...register('district')} placeholder="Kozhikode" className={inputClass(errors.district)} />
        </FormField>
        <FormField label="State" error={errors.state?.message}>
          <input {...register('state')} placeholder="Kerala" className={inputClass(errors.state)} />
        </FormField>
        <FormField label="PIN Code" error={errors.postalCode?.message}>
          <input {...register('postalCode')} placeholder="673001" maxLength={6} className={inputClass(errors.postalCode)} />
        </FormField>
      </div>

      {/* Default toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div className="relative">
          <input type="checkbox" {...register('isDefault')} className="sr-only peer" />
          <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-primary-600 transition-colors"></div>
          <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5"></div>
        </div>
        <span className="text-sm font-medium text-gray-700">Set as default address</span>
      </label>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" isLoading={isPending} className="flex-1">
          {defaultValues ? 'Save Changes' : 'Add Address'}
        </Button>
      </div>
    </form>
  );
};
