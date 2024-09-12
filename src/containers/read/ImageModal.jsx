// src/components/ImageModal.js
import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { PlusIcon, MinusIcon, XMarkIcon } from '@heroicons/react/24/outline'; // Import icons

Modal.setAppElement('#root'); // For accessibility reasons

const ImageModal = ({ isOpen, onRequestClose, imageUrl }) => {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setScale(1);
    }
  }, [isOpen]);

  const zoomIn = () => setScale(prevScale => Math.min(prevScale * 1.2, 3)); // Cap zoom scale
  const zoomOut = () => setScale(prevScale => Math.max(prevScale / 1.2, 0.5)); // Cap zoom scale

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      className="fixed inset-0 flex items-center justify-center p-4"
      overlayClassName="fixed inset-0 bg-black bg-opacity-75"
    >
      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-lg max-w-[80vh] max-h-[80vh] overflow-hidden">
        {/* Image Container */}
        <div className="relative w-full h-full overflow-auto">
          <img
            src={imageUrl}
            alt="Zoomable"
            style={{
              transform: `scale(${scale})`,
              transition: 'transform 0.3s',
              display: 'block',
              maxWidth: 'none',
            }}
          />
        </div>

        {/* Buttons */}
        <div className="fixed top-4 right-4 z-30 flex flex-col space-y-2">
          <button
            onClick={zoomIn}
            className="bg-blue-600 text-white p-3 rounded-full shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 flex items-center justify-center"
          >
            <PlusIcon className="h-6 w-6" />
          </button>
          <button
            onClick={zoomOut}
            className="bg-blue-600 text-white p-3 rounded-full shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 flex items-center justify-center"
          >
            <MinusIcon className="h-6 w-6" />
          </button>
          <button
            onClick={onRequestClose}
            className="bg-red-600 text-white p-3 rounded-full shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-all duration-300 flex items-center justify-center"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ImageModal;
