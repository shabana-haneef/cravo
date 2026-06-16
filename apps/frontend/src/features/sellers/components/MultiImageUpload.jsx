import React, { useState, useCallback, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';

const ACCEPTED_TYPES = {
  'image/jpeg': true,
  'image/png': true,
  'image/webp': true,
};
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const MAX_IMAGES = 10;

const PreviewItem = ({ fileOrObj, idx, onRemove, onMakeCover }) => {
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    const isFile = fileOrObj instanceof File;
    if (isFile) {
      const url = URL.createObjectURL(fileOrObj);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(fileOrObj.url);
    }
  }, [fileOrObj]);

  if (!previewUrl) return null;

  return (
    <div className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
      <img src={previewUrl} alt={`preview-${idx}`} className="w-full h-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-600 hover:text-red-500 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-all"
      >
        <X size={14} />
      </button>
      
      {idx > 0 && (
        <button
          type="button"
          onClick={onMakeCover}
          className="absolute bottom-2 right-2 px-2 py-1 bg-white/90 backdrop-blur-sm text-gray-700 hover:text-white hover:bg-[#1E3A2B] text-[10px] font-bold uppercase rounded-md opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10"
        >
          Make Cover
        </button>
      )}

      {idx === 0 && (
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-[#1E3A2B]/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase rounded-md z-10">
          Cover
        </div>
      )}
    </div>
  );
};

/**
 * Handles multiple image selection and previews.
 * For editing, it can also accept existing image objects (with `url`).
 */
export const MultiImageUpload = ({ value = [], onChange, error }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleFiles = useCallback((newFiles) => {
    setLocalError('');
    const currentCount = value.length;
    
    if (currentCount + newFiles.length > MAX_IMAGES) {
      setLocalError(`You can only upload up to ${MAX_IMAGES} images.`);
      return;
    }

    const validFiles = [];
    for (const file of newFiles) {
      if (!ACCEPTED_TYPES[file.type]) {
        setLocalError('Only JPG, PNG, and WebP images are allowed.');
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setLocalError(`Each file must be under ${MAX_SIZE_MB}MB.`);
        return;
      }
      validFiles.push(file);
    }

    onChange([...value, ...validFiles]);
  }, [value, onChange]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleFiles(files);
  }, [handleFiles]);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) handleFiles(files);
    e.target.value = ''; 
  };

  const handleRemove = (indexToRemove) => {
    const newValue = value.filter((_, i) => i !== indexToRemove);
    onChange(newValue);
  };

  const handleMakeCover = (indexToCover) => {
    if (indexToCover === 0) return;
    const newValue = [...value];
    const [item] = newValue.splice(indexToCover, 1);
    newValue.unshift(item); // Move to start
    onChange(newValue);
  };

  const displayError = localError || error;

  return (
    <div className="flex flex-col gap-3">
      {/* Previews Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-2">
          {value.map((fileOrObj, idx) => {
            const isFile = fileOrObj instanceof File;
            return (
              <PreviewItem
                key={isFile ? fileOrObj.name + idx : fileOrObj.id}
                fileOrObj={fileOrObj}
                idx={idx}
                onRemove={() => handleRemove(idx)}
                onMakeCover={() => handleMakeCover(idx)}
              />
            );
          })}
        </div>
      )}

      {/* Upload Zone */}
      {value.length < MAX_IMAGES && (
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
          <input type="file" multiple className="hidden" accept=".jpg,.jpeg,.png,.webp" onChange={handleInputChange} />
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDragging ? 'bg-[#1E3A2B] text-white' : 'bg-gray-200 text-gray-500'}`}>
            {isDragging ? <Upload size={22} /> : <ImageIcon size={22} />}
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">
              {isDragging ? 'Drop images here' : 'Click or drag images to upload'}
            </p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP — max {MAX_SIZE_MB}MB per image</p>
            <p className="text-xs font-medium text-[#1E3A2B] mt-1">{value.length} / {MAX_IMAGES} uploaded</p>
          </div>
        </label>
      )}

      {displayError && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1">
          <AlertCircle size={13} />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
};
