import React, { useState, useEffect, useContext } from 'react';
import { imageApi } from '../../../../backend-adapter/BackendAdapter';
import ImageModal from '../../../image/ImageModal';
import { AppContext } from '../../../../store/app-context';

const Image = ({ block, contentState }) => {
    const [imageData, setImageData] = useState(null);
    const [imageModalIsOpen, setImageModalIsOpen] = useState(false);
    const { translate : t } = useContext(AppContext);

    const imageEntity = contentState.getEntity(block.getEntityAt(0)).getData();

    const fetchImageData = async () => {
        console.warn('WARNING! fetching image data...');
        try {
            console.log('before setting image data');
            console.log('image id: ', imageEntity.id);
            const data = await imageApi.getDataById(imageEntity.id);
            setImageData(data);
            console.log('after setting image data');
            imageEntity.data = data;
        } catch (error) {
            console.error('Error fetching image data:', error);
        }
    };

    useEffect(() => {
        fetchImageData();
    }, [imageEntity]);

    return (
        <div>
            <div className='select-none cursor-pointer' onClick={()=>setImageModalIsOpen(true)}>
                {imageData ? <img src={imageData} alt="image" className='rounded' /> : t('loading') + '...'}
            </div>
            <ImageModal
                isOpen={imageModalIsOpen}
                onClose={() => setImageModalIsOpen(false)}
                image={imageEntity}
            />
        </div>
    );
};

export default Image;