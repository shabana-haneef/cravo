import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useAddresses, useCreateAddress, useUpdateAddress,
  useDeleteAddress, useSetDefaultAddress
} from '../hooks/useUserQueries.js';
import { AddressForm } from '../components/AddressForm.jsx';
import { Modal, ConfirmModal } from '../../../components/ui/Modal.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import {
  MapPin, Home, Briefcase, Plus, Edit2, Trash2,
  Star, ChevronLeft, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

const LABEL_META = {
  HOME: { icon: Home, color: 'bg-blue-100 text-blue-700', label: 'Home' },
  OFFICE: { icon: Briefcase, color: 'bg-purple-100 text-purple-700', label: 'Office' },
  OTHER: { icon: MapPin, color: 'bg-orange-100 text-orange-700', label: 'Other' },
};

const AddressSkeleton = () => (
  <div className="animate-pulse space-y-4">
    {[1, 2, 3].map(i => (
      <div key={i} className="h-40 bg-gray-100 rounded-2xl"></div>
    ))}
  </div>
);

const EmptyAddresses = ({ onAdd }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center mb-6">
      <MapPin className="w-12 h-12 text-primary-400" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-2">No addresses saved</h3>
    <p className="text-gray-500 max-w-sm mb-8">
      Add a delivery address to speed up your checkout experience.
    </p>
    <Button onClick={onAdd} className="h-11 px-8">
      <Plus size={18} className="mr-2" /> Add Address
    </Button>
  </div>
);

export const AddressesPage = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const { data, isLoading, isError, refetch } = useAddresses();
  const { mutate: createAddress, isPending: isCreating } = useCreateAddress();
  const { mutate: updateAddress, isPending: isUpdating } = useUpdateAddress();
  const { mutate: deleteAddress, isPending: isDeleting } = useDeleteAddress();
  const { mutate: setDefault, isPending: isSettingDefault } = useSetDefaultAddress();

  const addresses = data?.data?.addresses || [];

  const handleCreate = (formData) => {
    createAddress(formData, {
      onSuccess: () => { toast.success('Address added!'); setIsCreateOpen(false); },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to add address'),
    });
  };

  const handleUpdate = (formData) => {
    updateAddress({ id: editingAddress.id, data: formData }, {
      onSuccess: () => { toast.success('Address updated!'); setEditingAddress(null); },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to update address'),
    });
  };

  const handleDelete = () => {
    deleteAddress(deletingId, {
      onSuccess: () => { toast.success('Address deleted'); setDeletingId(null); },
      onError: () => toast.error('Failed to delete address'),
    });
  };

  const handleSetDefault = (address) => {
    setDefault({ id: address.id, currentData: address }, {
      onSuccess: () => toast.success('Default address updated!'),
      onError: () => toast.error('Failed to set default'),
    });
  };

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link to="/profile" className="inline-flex items-center text-sm text-gray-500 hover:text-primary-600 font-medium mb-2 transition-colors">
            <ChevronLeft size={16} className="mr-1" /> Back to Profile
          </Link>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Addresses</h1>
        </div>
        {addresses.length > 0 && (
          <Button onClick={() => setIsCreateOpen(true)} className="h-10 px-5">
            <Plus size={18} className="mr-2" /> Add New
          </Button>
        )}
      </div>

      {isLoading ? (
        <AddressSkeleton />
      ) : isError ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">Failed to load addresses.</p>
          <button onClick={refetch} className="text-primary-600 hover:underline font-medium">Retry</button>
        </div>
      ) : addresses.length === 0 ? (
        <EmptyAddresses onAdd={() => setIsCreateOpen(true)} />
      ) : (
        <div className="space-y-4">
          {addresses.map((address) => {
            const meta = LABEL_META[address.label] || LABEL_META.OTHER;
            const LabelIcon = meta.icon;
            return (
              <div
                key={address.id}
                className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden transition-all ${
                  address.isDefault ? 'border-primary-300' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${meta.color}`}>
                        <LabelIcon size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-bold text-gray-900">{address.fullName}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>
                            {meta.label}
                          </span>
                          {address.isDefault && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">
                              <CheckCircle2 size={11} /> Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mb-0.5">{address.phone}</p>
                        <p className="text-sm text-gray-700">
                          {address.addressLine1}
                          {address.addressLine2 && `, ${address.addressLine2}`}
                        </p>
                        <p className="text-sm text-gray-700">
                          {address.city}
                          {address.district && `, ${address.district}`}, {address.state} – {address.postalCode}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setEditingAddress(address)}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={17} />
                      </button>
                      <button
                        onClick={() => setDeletingId(address.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>

                  {/* Set Default button */}
                  {!address.isDefault && (
                    <div className="mt-4 pt-4 border-t border-gray-50">
                      <button
                        onClick={() => handleSetDefault(address)}
                        disabled={isSettingDefault}
                        className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <Star size={13} /> Set as Default
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Address Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Address"
        maxWidth="max-w-2xl"
      >
        <AddressForm
          onSubmit={handleCreate}
          isPending={isCreating}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>

      {/* Edit Address Modal */}
      <Modal
        isOpen={!!editingAddress}
        onClose={() => setEditingAddress(null)}
        title="Edit Address"
        maxWidth="max-w-2xl"
      >
        <AddressForm
          defaultValues={editingAddress}
          onSubmit={handleUpdate}
          isPending={isUpdating}
          onCancel={() => setEditingAddress(null)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete Address"
        message="Are you sure you want to delete this address? This action cannot be undone."
        confirmLabel="Delete Address"
      />
    </div>
  );
};
