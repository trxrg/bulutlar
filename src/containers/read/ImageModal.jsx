import React, { useState, useEffect, useContext } from 'react';
import Modal from 'react-modal';
import { MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon, XMarkIcon } from '@heroicons/react/24/solid';
import ActionButton from '../../components/ActionButton';
import { deleteImage } from '../../backend-adapter/BackendAdapter.js';
import { ReadContext } from "../../store/read-context";

Modal.setAppElement('#root');

const ImageModal = ({ isOpen, onClose, image }) => {

    const { syncArticleFromBE } = useContext(ReadContext);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        if (isOpen) {
            setScale(1);
        }
    }, [isOpen]);

    const zoomIn = () => setScale(prevScale => Math.min(prevScale * 1.2, 10));
    const zoomOut = () => setScale(prevScale => Math.max(prevScale / 1.2, 1));

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
            <div className="relative rounded-lg shadow-lg">
                <div className="max-w-[80vw] max-h-[80vh] overflow-auto">
                    {image && <img
                        src={image.data}
                        alt={image.name}
                        style={{
                            transform: `scale(${scale})`,
                            transformOrigin: 'left top',
                            transition: 'transform 0.3s',
                            maxWidth: '80vw',
                            maxHeight: '80vh',
                            display: 'block',
                            objectFit: 'contain'
                        }}
                    />}
                </div>

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
