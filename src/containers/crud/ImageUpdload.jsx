import React, { useState } from 'react';

const ImageUpload = () => {
  const [images, setImages] = useState([]);

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files);
    const newImages = files.map((file) => ({
      id: URL.createObjectURL(file),
      file: file,
    }));
    setImages((prevImages) => [...prevImages, ...newImages]);
  };

  const handleDeleteImage = (id) => {
    setImages((prevImages) => prevImages.filter((image) => image.id !== id));
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        multiple
        className="mb-4"
      />
      <div className="grid grid-cols-3 gap-4">
        {images.map((image) => (
          <div key={image.id} className="relative">
            <img
              src={image.id}
              alt="Thumbnail"
              className="w-full h-auto object-cover rounded"
            />
            <button
              onClick={() => handleDeleteImage(image.id)}
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
