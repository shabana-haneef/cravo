import React, { useState } from 'react';
import { useProfile, useUpdateProfile } from '../hooks/useUserQueries.js';
import { useAuthStore } from '../../../store/auth.store.js';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema } from '../schemas/user.schemas.js';
import { Button } from '../../../components/ui/Button.jsx';
import { Link } from 'react-router-dom';
import {
  User, Mail, Phone, Calendar, Shield, CheckCircle2, Edit2,
  MapPin, ChevronRight, Camera, ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

const ProfileSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-8 w-48 bg-gray-200 rounded mb-6"></div>
    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
        <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
        <div className="flex-1 space-y-3 w-full">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
          <div className="h-4 bg-gray-100 rounded w-64"></div>
          <div className="h-4 bg-gray-100 rounded w-40"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 bg-gray-100 rounded-xl"></div>
        ))}
      </div>
    </div>
  </div>
);

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 shrink-0">
      <Icon size={18} className="text-primary-600" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-gray-900 truncate">{value || '—'}</p>
    </div>
  </div>
);

const inputClass = (hasError) =>
  `w-full px-3.5 py-2.5 border rounded-lg text-sm outline-none transition-all ${
    hasError
      ? 'border-red-400 focus:ring-2 focus:ring-red-200'
      : 'border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100'
  }`;

export const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const { data, isLoading, isError, refetch } = useProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const { user } = useAuthStore();

  const profile = data?.data?.profile;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(profileSchema),
    values: profile
      ? {
          fullName: profile.fullName || '',
          phone: profile.phone || '',
          avatar: profile.avatar || '',
          dateOfBirth: profile.dateOfBirth
            ? new Date(profile.dateOfBirth).toISOString().slice(0, 10)
            : '',
        }
      : {},
  });

  const onSubmit = (data) => {
    const payload = {
      fullName: data.fullName,
      phone: data.phone,
      avatar: data.avatar || null,
      dateOfBirth: data.dateOfBirth || null,
    };
    updateProfile(payload, {
      onSuccess: () => {
        toast.success('Profile updated successfully!');
        setIsEditing(false);
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
    });
  };

  if (isLoading) return <ProfileSkeleton />;
  if (isError) return (
    <div className="text-center py-16">
      <p className="text-gray-500 mb-4">Failed to load profile.</p>
      <button onClick={refetch} className="text-primary-600 hover:underline font-medium">Try again</button>
    </div>
  );

  const initials = profile?.fullName
    ? profile.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() || '?';

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-8">My Profile</h1>

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header Banner */}
          <div className="h-24 bg-gradient-to-r from-primary-600 to-primary-400 relative">
            <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22%23fff%22%20fill-opacity%3D%221%22%20fill-rule%3D%22evenodd%22%3E%3Cpath%20d%3D%22M0%2040L40%200H20L0%2020M40%2040V20L20%2040%22/%3E%3C/g%3E%3C/svg%3E')]"></div>
          </div>

          <div className="px-6 sm:px-8 pb-8">
            {/* Avatar Row */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-6">
              <div className="relative w-24 h-24">
                {profile?.avatar ? (
                  <img src={profile.avatar} alt={profile.fullName} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary-600 border-4 border-white shadow-lg flex items-center justify-center text-white text-3xl font-bold">
                    {initials}
                  </div>
                )}
              </div>
              <div className="pb-1">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} size="sm" variant="outline" className="flex items-center gap-2">
                    <Edit2 size={15} /> Edit Profile
                  </Button>
                ) : (
                  <button onClick={() => { setIsEditing(false); reset(); }} className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors">
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {!isEditing ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{profile?.fullName || 'No name set'}</h2>
                <p className="text-gray-500 text-sm mb-6">{user?.email}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow icon={Mail} label="Email" value={user?.email} />
                  <InfoRow icon={Phone} label="Phone" value={profile?.phone} />
                  <InfoRow icon={Calendar} label="Date of Birth" value={profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-IN') : null} />
                  <InfoRow icon={Shield} label="Account Status" value={user?.isEmailVerified ? 'Email Verified' : 'Not Verified'} />
                </div>
              </>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Full Name</label>
                    <input {...register('fullName')} placeholder="Your full name" className={inputClass(errors.fullName)} />
                    {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Phone</label>
                    <input {...register('phone')} placeholder="10-digit mobile number" className={inputClass(errors.phone)} />
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Date of Birth</label>
                    <input type="date" {...register('dateOfBirth')} className={inputClass(errors.dateOfBirth)} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Avatar URL (Optional)</label>
                    <input {...register('avatar')} placeholder="https://..." className={inputClass(errors.avatar)} />
                    {errors.avatar && <p className="text-xs text-red-500 mt-1">{errors.avatar.message}</p>}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" isLoading={isPending} className="h-11 px-8">
                    Save Changes
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Account Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Account Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-3 border-b border-gray-50">
              <span className="text-sm text-gray-500">Email Address</span>
              <span className="text-sm font-medium text-gray-900">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-50">
              <span className="text-sm text-gray-500">Role</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">
                {user?.role}
              </span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-sm text-gray-500">Email Verification</span>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${user?.isEmailVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                <CheckCircle2 size={14} />
                {user?.isEmailVerified ? 'Verified' : 'Not Verified'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
          <Link to="/addresses" className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors rounded-t-2xl">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center">
                <MapPin size={18} className="text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Manage Addresses</p>
                <p className="text-xs text-gray-500">View and edit your saved delivery locations</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </Link>
        </div>
      </div>
    </div>
  );
};
