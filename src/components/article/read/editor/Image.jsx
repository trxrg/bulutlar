import React, { useState, useEffect, useContext } from 'react';
import { imageApi } from '../../../../backend-adapter/BackendAdapter';
import ImageModal from '../../../image/ImageModal';
import { AppContext } from '../../../../store/app-context';
import { ReadContext } from '../../../../store/read-context';
import ContextMenu from '../../../common/ContextMenu';
import ActionButton from '../../../common/ActionButton';
import ConfirmModal from '../../../common/ConfirmModal';
import toastr from 'toastr';

const Image = (props) => {
    const block = props.block;
    const contentState = props.contentState;
    const onDelete = props.blockProps.onDelete;

    const [imageData, setImageData] = useState(null);
    const [imageModalIsOpen, setImageModalIsOpen] = useState(false);
    const [contextMenuIsOpen, setContextMenuIsOpen] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 10, y: 10 });
    const [deleteConfirmModalIsOpen, setDeleteConfirmModalIsOpen] = useState(false);
    
    const { translate: t } = useContext(AppContext);
    const { editable } = useContext(ReadContext);

    const imageEntity = contentState.getEntity(block.getEntityAt(0)).getData();

    const fetchImageData = async () => {
        console.warn('WARNING! fetching image data...');
        try {
            setImageData(await imageApi.getDataById(imageEntity.id));
        } catch (error) {
            console.error('Error fetching image data:', error);
        }
    };

    useEffect(() => {
        fetchImageData();
    }, [imageEntity]);

    const handleRightClick = (e) => {
        e.preventDefault();

        if (!editable) return;

        const grandParentRect = e.currentTarget.getBoundingClientRect();

        const posx = e.clientX - grandParentRect.left;
        const posy = e.clientY - grandParentRect.top;

        setContextMenuIsOpen(true);
        setContextMenuPosition({ x: posx, y: posy });
    }

    const handleDeleteImage = async () => {
        setDeleteConfirmModalIsOpen(false);
        try {
            onDelete();
            // await imageApi.deleteById(imageEntity.id);
            toastr.success(t('image') + t('deleted'));
        } catch (error) {
            console.error('Error deleting image:', error);
            toastr.error(t('error deleting image'));
        }        
    }

    return (
        <>
            <div className='select-none cursor-pointer inline-block w-full' onClick={() => setImageModalIsOpen(true)} onContextMenu={handleRightClick}>
                {imageData ? <img src={imageData} alt="image" className='rounded w-full' /> : t('loading') + '...'}
            </div>
            <ImageModal
                isOpen={imageModalIsOpen}
                onClose={() => setImageModalIsOpen(false)}
                imageData={imageData}
            />
            <ContextMenu isOpen={contextMenuIsOpen} onClose={() => setContextMenuIsOpen(false)} position={{ top: contextMenuPosition.y, left: contextMenuPosition.x }}>
                <div className='flex flex-col'>
                    <ActionButton onClick={() => setDeleteConfirmModalIsOpen(true)} color='red'>{t('deleteImage')}</ActionButton>
                </div>
            </ContextMenu>
            <ConfirmModal message={t('sureDeletingImage')} isOpen={deleteConfirmModalIsOpen} onClose={() => setDeleteConfirmModalIsOpen(false)} onConfirm={handleDeleteImage} />
        </>
    );
};

export default Image;