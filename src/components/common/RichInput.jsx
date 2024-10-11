import React, { useState } from 'react';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const RichInput = ({ initialText, handleSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState(initialText);

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleConfirmClick = () => {
        setIsEditing(false);
        handleSave(inputValue);
    };

    const handleCancelClick = () => {
        setIsEditing(false);
        setInputValue(initialText); 
    };

    return (
        <div className="relative p-2 group">
            {isEditing ? (
                <div className='flex gap-2'>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="border p-1 rounded-md flex-1"
                    />
                    <div className="flex">
                        <button
                            className="p-1 text-green-500 hover:text-green-700"
                            onClick={handleConfirmClick}
                        >
                            <CheckIcon className="w-4 h-4"/>
                        </button>
                        <button
                            className="p-1 text-red-500 hover:text-red-700"
                            onClick={handleCancelClick}
                        >
                            <XMarkIcon className="w-4 h-4"/>
                        </button>
                    </div>
                </div>
            ) : (
                <div className='flex gap-2'>
                    <div className='p-1 flex-1'>{initialText}</div>
                    <button
                        className="p-1 text-gray-500 hover:text-gray-700 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        onClick={handleEditClick}
                    >
                        <PencilIcon className="w-4 h-4"/>
                    </button>
                </div>
            )}
        </div>
    );
};

export default RichInput;
