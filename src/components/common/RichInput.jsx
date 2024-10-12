import React, { useState, useEffect, useRef } from 'react';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import FormatButton from './FormatButton';

const RichInput = ({ initialText, handleSave, inputType = 'text', ...props }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState(initialText);
    const [inputWidth, setInputWidth] = useState('auto');
    const textRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputType === 'text' && textRef.current) {
            setInputWidth(`${textRef.current.scrollWidth}px`);
        }
    }, []);

    useEffect(() => {
        if (inputRef.current) {
            setTimeout(() => {
                inputRef.current.focus();
                if (inputType === 'text')
                    inputRef.current.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length);
            }, 0);
        }
    }, [isEditing]);

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
                            ref={inputRef}
                            type={inputType}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="rounded-md, px-1"
                            style={{ width: inputWidth }}
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
                        <div className='flex items-center px-1' ref={textRef} >{initialText}</div>
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