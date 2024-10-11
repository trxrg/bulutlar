import React, { useState, useRef, useEffect } from 'react';
import ImageInput from './ImageInput.jsx';
import ActionButton from '../common/ActionButton';
import { imageApi } from '../../backend-adapter/BackendAdapter.js';

const ImageUpload = ({ images, setImages}) => {

    const imageInputRef = useRef();
    const [imageDatas, setImageDatas] = useState([]);    

    const handleButtonClick = (e) => {
        e.preventDefault();
        imageInputRef.current.addImage();
    }

    const handleSelectImages = (newImages) => {
        console.log('in handleSelectImages');
        setImages((prevImages) => {
            return [
                ...prevImages,
                ...newImages.filter(newImage =>
                    !prevImages.some(existingImage => existingImage.path === newImage.path))
            ];
        })
    };

    const handleDeleteImage = (e, path) => {
        e.preventDefault();
        setImages((prevImages) => prevImages.filter((image) => image.path !== path));
    };

    useEffect(() => {
        const fetchImageDatas = async () => {
            console.log('fetchImageDatas called');
            try {
                const datas = await Promise.all(images.map(async image => ({ ...image, data: await imageApi.getDataByPath(image) })));
                setImageDatas(datas);
            } catch (err) {
                console.error('error in fetchImageDatas', err);
            }
        }
        fetchImageDatas();
    }, [images]);

    return (
        <div className='mb-4'>
            <ActionButton color={'blue'} onClick={handleButtonClick}>Add Image</ActionButton>
            <ImageInput onSelectImages={handleSelectImages} ref={imageInputRef}></ImageInput>
            <div className="grid grid-cols-3 gap-4">
                {imageDatas.map((imageData) => (
                    <div key={imageData.path} className="relative">
                        <img
                            src={imageData.data}
                            alt="Thumbnail"
                            className="w-full h-auto object-cover rounded"
                        />
                        <button
                            onClick={(e) => handleDeleteImage(e, imageData.path)}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                        >
                            &times;
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ImageUpload;
