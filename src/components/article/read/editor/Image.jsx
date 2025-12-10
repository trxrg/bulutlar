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
        setContextMenuIsOpen(true);
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
    }

    const handleDeleteImage = async () => {
        setDeleteConfirmModalIsOpen(false);
        try {
            onDelete(imageEntity.id);
            // await imageApi.deleteById(imageEntity.id);
            toastr.success(t('image') + t('deleted'));
        } catch (error) {
            console.error('Error deleting image:', error);
            toastr.error(t('error deleting image'));
        }        
    }

    const handleDownload = async () => {
        try {
            const result = await imageApi.download(imageEntity.id);
            if (result.success) {
                toastr.success(t('imageDownloaded'));
            } else if (result.canceled) {
                // User canceled, no need to show error
            }
        } catch (error) {
            console.error('Error downloading image:', error);
            toastr.error(t('errorDownloadingImage'));
        }
    };

    return (
        <div className='relative'>
            <div className='select-none cursor-pointer inline-block w-full' onClick={() => setImageModalIsOpen(true)} onContextMenu={handleRightClick}>
                {imageData ? <img src={imageData} alt="image" className='rounded w-full' /> : t('loading') + '...'}
            </div>
            <ImageModal
                isOpen={imageModalIsOpen}
                onClose={() => setImageModalIsOpen(false)}
                imageData={imageData}
            />
            <ContextMenu isOpen={contextMenuIsOpen} onClose={() => setContextMenuIsOpen(false)} position={{ top: contextMenuPosition.y, left: contextMenuPosition.x }}>
                <div className='flex flex-col gap-2'>
                    <ActionButton onClick={handleDownload} color='purple'>{t('download')}</ActionButton>
                    {editable && (
                        <ActionButton onClick={() => setDeleteConfirmModalIsOpen(true)} color='red'>{t('deleteImage')}</ActionButton>
                    )}
                </div>
            </ContextMenu>
            <ConfirmModal message={t('sureDeletingImage')} isOpen={deleteConfirmModalIsOpen} onClose={() => setDeleteConfirmModalIsOpen(false)} onConfirm={handleDeleteImage} />
        </div>
    );
};

export default Image;