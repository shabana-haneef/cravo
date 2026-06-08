import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button.jsx';

export const ErrorState = ({ title = 'Something went wrong', message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-red-50 rounded-xl border border-red-100 min-h-[300px]">
      <AlertCircle size={48} className="text-red-400 mb-4" />
      <h3 className="text-lg font-medium text-red-800 mb-2">{title}</h3>
      <p className="text-sm text-red-600 max-w-md mb-6">{message}</p>
      {onRetry && (
        <Button variant="danger" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};
