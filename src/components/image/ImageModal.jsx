import React, { useState, useEffect, useContext } from 'react';
import Modal from 'react-modal';
import { MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon, XMarkIcon } from '@heroicons/react/24/solid';

import RoundButton from '../common/RoundButton.jsx';
import ActionButton from '../common/ActionButton.jsx';

import { imageApi } from '../../backend-adapter/BackendAdapter.js';
import { ReadContext } from "../../store/read-context.jsx";


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
        onClose();
        await imageApi.deleteById(image.id);
        syncArticleFromBE();
    }

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            className="fixed inset-0 flex items-center justify-center p-4"
            overlayClassName="fixed top-0 left-0 z-50 w-full h-full bg-black bg-opacity-75"
            shouldCloseOnOverlayClick={true}
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
                        <RoundButton onClick={zoomIn} color='blue'>
                            <MagnifyingGlassPlusIcon className="h-6 w-6" />
                        </RoundButton>
                        <RoundButton onClick={zoomOut} color='blue'>
                            <MagnifyingGlassMinusIcon className="h-6 w-6" />
                        </RoundButton>
                        <RoundButton onClick={onClose} color='red'>
                            <XMarkIcon className="h-6 w-6" />
                        </RoundButton>
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
