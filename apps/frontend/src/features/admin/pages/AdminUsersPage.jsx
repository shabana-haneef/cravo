import React, { useEffect, useState } from 'react';
import { Users, Shield, ShieldAlert, CheckCircle, XCircle, MoreVertical, AlertTriangle } from 'lucide-react';
import { adminService } from '../services/admin.service.js';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: '', // 'role' or 'status'
    userId: null,
    userName: '',
    targetValue: '',
    currentValue: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.listUsers();
      setUsers(data.data?.users || []);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      toast.success(`User role updated to ${newRole}`);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update role');
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await adminService.updateUserStatus(userId, newStatus);
      toast.success(`User status updated to ${newStatus}`);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const triggerConfirmation = (type, user, targetValue, currentValue) => {
    setConfirmModal({
      isOpen: true,
      type,
      userId: user.id,
      userName: user.profile?.fullName || user.email,
      targetValue,
      currentValue
    });
  };

  const executeConfirmedAction = async () => {
    const { type, userId, targetValue } = confirmModal;
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    
    if (type === 'role') {
      await handleRoleChange(userId, targetValue);
    } else if (type === 'status') {
      await handleStatusChange(userId, targetValue);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A2B]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage all registered users.</p>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4 text-indigo-500">
            <Users size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-500 max-w-sm">The user list is currently empty.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500 uppercase tracking-wider">
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Joined At</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#1E3A2B]/10 flex items-center justify-center text-[#1E3A2B] font-bold">
                          {user.profile?.fullName?.[0] || user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{user.profile?.fullName || 'No Name'}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <select
                        value={user.role}
                        onChange={(e) => triggerConfirmation('role', user, e.target.value, user.role)}
                        className="bg-gray-50 border border-gray-200 text-sm rounded-lg focus:ring-[#1E3A2B] focus:border-[#1E3A2B] block w-full p-2 text-gray-700 cursor-pointer"
                      >
                        <option value="CUSTOMER">Customer</option>
                        <option value="SELLER">Seller</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <select
                        value={user.status}
                        onChange={(e) => triggerConfirmation('status', user, e.target.value, user.status)}
                        className={`text-sm rounded-lg border block w-full p-2 font-medium cursor-pointer ${
                          user.status === 'ACTIVE' 
                            ? 'bg-green-50 border-green-200 text-green-700' 
                            : 'bg-red-50 border-red-200 text-red-700'
                        }`}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="SUSPENDED">Suspended</option>
                      </select>
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      {/* Can add more actions like view profile etc. later */}
                      <button className="p-2 text-gray-400 hover:text-[#B88645] transition-colors rounded-lg hover:bg-[#B88645]/10">
                        <MoreVertical size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customized Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-100 flex flex-col items-center text-center"
            >
              <div className="w-14 h-14 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center text-amber-500 mb-4">
                <AlertTriangle size={28} />
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Confirm {confirmModal.type === 'role' ? 'Role' : 'Status'} Change
              </h3>
              
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Are you sure you want to change the {confirmModal.type} of{' '}
                <span className="font-bold text-gray-800">{confirmModal.userName}</span> from{' '}
                <span className="font-bold text-red-500">{confirmModal.currentValue}</span> to{' '}
                <span className="font-bold text-green-600">{confirmModal.targetValue}</span>?
                {confirmModal.type === 'status' && (
                  <span className="block mt-2 font-medium text-amber-600 bg-amber-50/50 p-2 rounded-lg text-xs border border-amber-100/50">
                    Note: Changing seller status will automatically synchronize their seller verification status and active shop products.
                  </span>
                )}
              </p>

              <div className="flex w-full gap-3 mt-2">
                <button
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={executeConfirmedAction}
                  className="flex-1 py-2.5 bg-[#1E3A2B] hover:bg-[#2a4f3c] text-white font-bold rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Confirm Change
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
