// src/components/ImageModal.js
import React, { useState, useEffect, useRef, useContext } from 'react';
import Modal from 'react-modal';
import { MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon, XMarkIcon } from '@heroicons/react/24/solid'; // Import v2 icons
import ActionButton from '../../components/ActionButton';
import { deleteImage } from '../../backend-adapter/BackendAdapter.js';
import { ReadContext } from "../../store/read-context";

Modal.setAppElement('#root'); // For accessibility reasons

const ImageModal = ({ isOpen, onClose, image }) => {

    const { syncArticleFromBE } = useContext(ReadContext);

    const [scale, setScale] = useState(1);
    const [initialScale, setInitialScale] = useState(1);
    const imageRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setScale(1);
            setInitialScale(1);
        }
    }, [isOpen]);

    useEffect(() => {
        if (imageRef.current) {
            // Get the dimensions of the image and modal container
            const img = imageRef.current;
            const modal = img.parentElement;

            // Calculate the scale to fit the image within the modal
            const imgWidth = img.naturalWidth;
            const imgHeight = img.naturalHeight;
            const modalWidth = modal.clientWidth;
            const modalHeight = modal.clientHeight;

            const widthScale = modalWidth / imgWidth;
            const heightScale = modalHeight / imgHeight;
            const newScale = Math.min(widthScale, heightScale);

            setInitialScale(newScale);
            setScale(newScale);
        }
    }, [image, isOpen]);

    const zoomIn = () => setScale(prevScale => Math.min(prevScale * 1.2, 10)); // Cap zoom scale
    const zoomOut = () => setScale(prevScale => Math.max(prevScale / 1.2, initialScale)); // Cap zoom scale

    const handleDeleteImage = async () => {
        await deleteImage(image.id);
        syncArticleFromBE();
        onClose();
    }

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            className="fixed inset-0 flex items-center justify-center p-4"
            overlayClassName="fixed inset-0 bg-black bg-opacity-75"
        >
            {/* Modal Content */}
            <div className="relative bg-white rounded-lg shadow-lg max-w-3xl max-h-[80vh] overflow-auto">
                {/* Image Container */}
                <div className="relative w-full h-full overflow-auto">
                    {image && <img
                        src={image.data}
                        alt="Zoomable"
                        ref={imageRef}
                        style={{
                            transform: `scale(${scale})`,
                            transformOrigin: 'left top',
                            transition: 'transform 0.3s',
                            maxWidth: '100%',
                            maxHeight: '100%',
                            display: 'block',
                        }}
                        className='object-contain'
                    />}
                </div>

                {/* Buttons */}
                <div className="fixed top-4 right-4 z-30 flex flex-col h-[80vh] justify-between items-center">
                    <div className='space-y-2'>
                        <button
                            onClick={zoomIn}
                            className="bg-blue-600 text-white p-3 rounded-full shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 flex items-center justify-center"
                        >
                            <MagnifyingGlassPlusIcon className="h-6 w-6" />
                        </button>
                        <button
                            onClick={zoomOut}
                            className="bg-blue-600 text-white p-3 rounded-full shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 flex items-center justify-center"
                        >
                            <MagnifyingGlassMinusIcon className="h-6 w-6" />
                        </button>
                        <button
                            onClick={onClose}
                            className="bg-red-600 text-white p-3 rounded-full shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-all duration-300 flex items-center justify-center"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>
                    <div>
                        <ActionButton onClick={handleDeleteImage} color='red'>Delete Image</ActionButton>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ImageModal;
