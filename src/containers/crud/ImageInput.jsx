import React, { useRef } from "react";

const ImageInput = React.forwardRef(({ onSelectImages }, ref) => {

    const fileInputRef = useRef();

    const addImage = () => fileInputRef.current.click();

    const handleImagesChange = (event) => {

        const files = Array.from(event.target.files);
        const images = files.map((file) => ({
            name: file.name, 
            path: file.path, 
            type: file.type, 
            size: file.size
        }));

        console.log('images in imageinput')
        console.log(images)
        
        onSelectImages(images);
    }

    React.useImperativeHandle(ref, () => ({
        addImage
    }));

    return (
        <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImagesChange}
            ref={fileInputRef}
            style={{ display: 'none' }}
        />
    );
})

export default ImageInput;