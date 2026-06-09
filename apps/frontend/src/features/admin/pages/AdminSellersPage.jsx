import React, { useEffect, useState } from 'react';
import { Store, Check, X, FileText, Image as ImageIcon, MapPin, Search } from 'lucide-react';
import { adminService } from '../services/admin.service.js';
import { toast } from 'sonner';

export const AdminSellersPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING'); // PENDING, APPROVED, REJECTED
  
  // Modal State
  const [selectedApp, setSelectedApp] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await adminService.listSellerApplications(filter);
      setApplications(data.data?.applications || []);
    } catch (error) {
      toast.error('Failed to load seller applications');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await adminService.approveApplication(id);
      toast.success('Seller application approved successfully');
      setIsModalOpen(false);
      fetchApplications();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve application');
    }
  };

  const handleReject = async (id) => {
    if (!rejectReason) {
      toast.error('Please provide a rejection reason');
      return;
    }
    try {
      await adminService.rejectApplication(id, rejectReason);
      toast.success('Seller application rejected');
      setIsModalOpen(false);
      setRejectReason('');
      fetchApplications();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject application');
    }
  };

  const openReviewModal = (app) => {
    setSelectedApp(app);
    setRejectReason('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedApp(null);
    setIsModalOpen(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">Pending</span>;
      case 'APPROVED':
        return <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">Approved</span>;
      case 'REJECTED':
        return <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">Rejected</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seller Applications</h1>
          <p className="text-sm text-gray-500 mt-1">Review and approve seller requests.</p>
        </div>
        
        {/* Filters */}
        <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
          {['PENDING', 'APPROVED', 'REJECTED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                filter === status 
                  ? 'bg-[#1E3A2B] text-white shadow' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A2B]"></div>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-16 h-16 bg-[#1E3A2B]/5 rounded-full flex items-center justify-center mb-4 text-[#1E3A2B]">
            <Store size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No applications found</h3>
          <p className="text-gray-500 max-w-sm">There are no {filter.toLowerCase()} seller applications at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((app) => (
            <div key={app.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="p-5 border-b border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold text-lg">
                      {app.user?.profile?.fullName?.[0] || 'U'}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{app.user?.profile?.fullName || 'No Name'}</h3>
                      <p className="text-xs text-gray-500">{app.user?.email}</p>
                    </div>
                  </div>
                  {getStatusBadge(app.status)}
                </div>
                
                <div className="space-y-2 mt-4 text-sm">
                  <div className="flex items-start gap-2 text-gray-600">
                    <FileText size={16} className="mt-0.5 text-gray-400" />
                    <p className="line-clamp-2">{app.bio || 'No bio provided.'}</p>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Check size={16} className="text-green-500" />
                    <span>{app.documents?.length || 0} Documents uploaded</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50 flex gap-3">
                <button 
                  onClick={() => openReviewModal(app)}
                  className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-[#B88645] text-[#B88645] rounded-lg font-medium hover:bg-[#B88645] hover:text-white transition-colors"
                >
                  <Search size={16} />
                  Review Application
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {isModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Store className="text-[#1E3A2B]" />
                Review Seller Application
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Applicant Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Applicant Details</h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Name:</span>
                      <span className="font-medium text-gray-900">{selectedApp.user?.profile?.fullName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email:</span>
                      <span className="font-medium text-gray-900">{selectedApp.user?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phone:</span>
                      <span className="font-medium text-gray-900">{selectedApp.user?.profile?.phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Applied On:</span>
                      <span className="font-medium text-gray-900">{new Date(selectedApp.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Business Bio</h3>
                  <div className="bg-gray-50 rounded-xl p-4 h-full border border-gray-100">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedApp.bio || 'No bio provided.'}</p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Uploaded KYC Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {selectedApp.documents?.map((doc) => (
                    <div key={doc.id} className="border border-gray-200 rounded-xl overflow-hidden group">
                      <div className="bg-gray-100 p-3 flex justify-between items-center border-b border-gray-200">
                        <span className="font-medium text-gray-700 text-sm">{doc.type.replace('_', ' ')}</span>
                        <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline">View Full</a>
                      </div>
                      <div className="h-48 bg-gray-50 flex items-center justify-center p-2 relative">
                        {doc.fileUrl.toLowerCase().includes('.pdf') ? (
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <FileText size={48} className="mb-2 text-indigo-400" />
                            <span className="text-sm font-medium">PDF Document</span>
                            <span className="text-xs mt-1">Click "View Full" to read</span>
                          </div>
                        ) : (
                          <img 
                            src={doc.fileUrl} 
                            alt={doc.type} 
                            className="max-h-full max-w-full object-contain rounded drop-shadow-sm group-hover:scale-105 transition-transform"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                  {(!selectedApp.documents || selectedApp.documents.length === 0) && (
                    <div className="col-span-3 text-center py-10 bg-red-50 text-red-500 rounded-xl border border-red-100">
                      No documents found for this application!
                    </div>
                  )}
                </div>
              </div>

              {/* Reject Reason Input (only shown if PENDING) */}
              {selectedApp.status === 'PENDING' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for Rejection (if rejecting)</label>
                  <textarea
                    rows={2}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-shadow text-gray-700"
                    placeholder="E.g., ID proof is not clear, Address proof doesn't match..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            {selectedApp.status === 'PENDING' && (
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 p-4 flex justify-end gap-3 rounded-b-2xl">
                <button
                  onClick={() => handleReject(selectedApp.id)}
                  className="px-6 py-2.5 rounded-lg font-bold border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                >
                  Reject Application
                </button>
                <button
                  onClick={() => handleApprove(selectedApp.id)}
                  className="px-6 py-2.5 rounded-lg font-bold bg-[#1E3A2B] text-white hover:bg-[#2a4f3c] transition-colors shadow-lg"
                >
                  Approve & Grant Seller Access
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
