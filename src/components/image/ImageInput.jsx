import React, { useRef } from "react";

const ImageInput = React.forwardRef(({ onSelectImages }, ref) => {

    const fileInputRef = useRef();

    const click = () => fileInputRef.current.click();

    const handleImagesChange = (event) => {

        const files = Array.from(event.target.files);
        const images = files.map((file) => ({
            name: file.name, 
            path: file.path, 
            type: file.type, 
            size: file.size
        }));
        
        onSelectImages(images);

        fileInputRef.current.value = null;
    }

    React.useImperativeHandle(ref, () => ({
        click
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