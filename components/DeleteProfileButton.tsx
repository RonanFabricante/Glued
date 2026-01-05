'use client';

import { deleteProfile } from '@/lib/actions/profile';
import { useState } from 'react';

export default function DeleteProfileButton() {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    setIsDeleting(true);
    try {
      await deleteProfile();
    } catch (error) {
      console.error('Error deleting profile:', error);
      setIsDeleting(false);
      setIsConfirming(false);
    }
  };

  const handleCancel = () => {
    setIsConfirming(false);
  };

  if (isConfirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-red-600">Are you sure?</span>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {isDeleting ? 'Deleting...' : 'Yes, delete'}
        </button>
        <button
          onClick={handleCancel}
          disabled={isDeleting}
          className="text-sm px-3 py-1 bg-calm-200 text-calm-700 rounded hover:bg-calm-300 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleDelete}
      className="text-sm text-red-600 hover:text-red-800 transition-colors"
    >
      Delete account
    </button>
  );
}
