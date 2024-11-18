import React, { useState, useEffect, useContext } from 'react';
import { imageApi } from '../../../../backend-adapter/BackendAdapter';
import ImageModal from '../../../image/ImageModal';
import { AppContext } from '../../../../store/app-context';
import ContextMenu from '../../../common/ContextMenu';
import ActionButton from '../../../common/ActionButton';
import ConfirmModal from '../../../common/ConfirmModal';

const Image = ({ block, contentState }) => {
    const [imageData, setImageData] = useState(null);
    const [imageModalIsOpen, setImageModalIsOpen] = useState(false);
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 10, y: 10 });
    const { translate: t } = useContext(AppContext);

    const imageEntity = contentState.getEntity(block.getEntityAt(0)).getData();

    const fetchImageData = async () => {
        console.warn('WARNING! fetching image data...');
        try {
            const data = await imageApi.getDataById(imageEntity.id);
            setImageData(data);
            imageEntity.data = data;
        } catch (error) {
            console.error('Error fetching image data:', error);
        }
    };

    useEffect(() => {
        fetchImageData();
    }, [imageEntity]);

    const handleRightClick = (e) => {
        e.preventDefault();

        const grandParentRect = e.currentTarget.parentElement.getBoundingClientRect();

        const posx = e.clientX - grandParentRect.left;
        const posy = e.clientY - grandParentRect.bottom;

        setShowContextMenu(true);
        setContextMenuPosition({ x: posx, y: posy });
    }

    const handleDeleteImage = () => {
        console.log('delete image');
        setShowContextMenu(false);
    }

    return (
        <div>
            <div className='select-none cursor-pointer' onClick={() => setImageModalIsOpen(true)} onContextMenu={handleRightClick}>
                {imageData ? <img src={imageData} alt="image" className='rounded' /> : t('loading') + '...'}
            </div>
            <ImageModal
                isOpen={imageModalIsOpen}
                onClose={() => setImageModalIsOpen(false)}
                image={imageEntity}
            />
            <ContextMenu isOpen={showContextMenu} onClose={() => setShowContextMenu(false)} position={{ top: contextMenuPosition.y, left: contextMenuPosition.x }}>
                <div className='flex flex-col'>
                    <ActionButton onClick={handleDeleteImage} color='red'>{t('deleteImage')}</ActionButton>
                </div>
            </ContextMenu>
        </div>
    );
};

export default Image;