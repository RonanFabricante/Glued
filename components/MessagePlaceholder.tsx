'use client';

import { useState } from 'react';

export default function MessagePlaceholder() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowModal(true)} className="btn-secondary w-full">
        Message
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full">
            <h3 className="text-xl font-bold text-calm-900 mb-4">Switch to WhatsApp</h3>
            <p className="text-calm-700 mb-6">
              For the MVP, we recommend continuing the conversation on WhatsApp or your preferred
              messaging app. In-app messaging is coming soon.
            </p>
            <button onClick={() => setShowModal(false)} className="btn-primary w-full">
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
