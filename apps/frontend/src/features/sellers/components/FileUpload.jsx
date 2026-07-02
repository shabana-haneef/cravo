import React, { useCallback, useState, useEffect } from 'react';
import { Upload, X, FileText, Image, AlertCircle } from 'lucide-react';

const ACCEPTED_TYPES = {
  'image/jpeg': true,
  'image/png': true,
  'image/webp': true,
  'application/pdf': true,
};
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

/**
 * Reusable drag-and-drop file upload component.
 * @param {string} label - Field label
 * @param {boolean} required - Whether the field is required
 * @param {File|null} value - Controlled file value
 * @param {Function} onChange - Called with (File|null) on change
 * @param {string} [error] - Validation error message from parent form
 */
export const FileUpload = ({ label, required = false, value, onChange, error }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (!value || !value.type.startsWith('image/')) {
      setPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [value]);

  const validate = (file) => {
    if (!ACCEPTED_TYPES[file.type]) {
      return 'Only JPG, PNG, WebP images and PDF files are allowed.';
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `File size must be under ${MAX_SIZE_MB}MB.`;
    }
    return null;
  };

  const handleFile = useCallback((file) => {
    if (!file) return;
    const validationError = validate(file);
    if (validationError) {
      setLocalError(validationError);
      onChange(null);
    } else {
      setLocalError('');
      onChange(file);
    }
  }, [onChange]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
    e.target.value = ''; // reset so same file can be re-uploaded
  };

  const handleRemove = () => {
    setLocalError('');
    onChange(null);
  };

  const displayError = localError || error;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {value ? (
        /* Preview */
        <div className="relative flex items-center gap-4 p-4 border-2 border-[#1E3A2B] rounded-xl bg-[#F0F8F3]">
          {value.type.startsWith('image/') ? (
            <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 shrink-0">
              <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
              <FileText size={28} className="text-[#1E3A2B]" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{value.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{(value.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-300 transition-colors shadow-sm"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        /* Drop Zone */
        <label
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-[#1E3A2B] bg-[#F0F8F3] scale-[1.01]'
              : displayError
              ? 'border-red-300 bg-red-50 hover:border-red-400'
              : 'border-gray-200 bg-gray-50 hover:border-[#1E3A2B] hover:bg-[#F0F8F3]'
          }`}
        >
          <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={handleInputChange} />
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDragging ? 'bg-[#1E3A2B] text-white' : 'bg-gray-200 text-gray-500'}`}>
            {isDragging ? <Upload size={22} /> : <Image size={22} />}
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">
              {isDragging ? 'Drop file here' : 'Drop file here or click to upload'}
            </p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP, PDF — max {MAX_SIZE_MB}MB</p>
          </div>
        </label>
      )}

      {displayError && (
        <div className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle size={13} />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
};
