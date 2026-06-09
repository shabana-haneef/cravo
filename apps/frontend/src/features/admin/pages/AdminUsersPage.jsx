import React from 'react';
import { Users } from 'lucide-react';

export const AdminUsersPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage all registered users.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4 text-indigo-500">
          <Users size={32} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">No users found</h3>
        <p className="text-gray-500 max-w-sm">The user list is currently empty. Once users register, they will appear here.</p>
      </div>
    </div>
  );
};
