import React, { useState } from 'react';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import FormatButton from './FormatButton';

const RichInput = ({ initialText, handleSave, ...props }) => {
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
        <div {...props}>
            <div className="relative group">
                {isEditing ? (
                    <div className='flex'>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="rounded-md"
                        />
                        <FormatButton onClick={handleConfirmClick}>
                            <CheckIcon className="w-4 h-4" />
                        </FormatButton>
                        <FormatButton onClick={handleCancelClick}>
                            <XMarkIcon className="w-4 h-4" />
                        </FormatButton>
                    </div>
                ) : (
                    <div className='flex flex-wrap'>
                        <div className='flex items-center'>{initialText}</div>
                        <FormatButton
                            className="opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                            onClick={handleEditClick}
                        >
                            <PencilIcon className="w-4 h-4" />
                        </FormatButton>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RichInput;
