import React, { useState, useEffect } from 'react';
import { imageApi } from '../../../../backend-adapter/BackendAdapter';

const Image = ({ block, contentState }) => {
    const [imageData, setImageData] = useState(null);

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
    }, []);

    return (
        <div className='select-none'>
            {imageData ? <img src={imageData} alt="image" className='rounded' /> : 'Loading...'}
        </div>
    );
};

export default Image;