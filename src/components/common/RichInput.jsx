import React, { useState, useEffect, useRef } from 'react';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import FormatButton from './FormatButton';

const RichInput = ({ initialText, handleSave, inputType = 'text', ...props }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState(inputType === 'date' ? convertDateFormat(initialText) : initialText);
    const [inputWidth, setInputWidth] = useState('auto');
    const textRef = useRef(null);
    const inputRef = useRef(null);
    
    useEffect(() => {
        if (textRef.current) {
            setInputWidth(`${textRef.current.scrollWidth}px`);
        }
    }, [initialText]);

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
        setInputValue(inputType === 'date' ? convertDateFormat(initialText) : initialText);
    };

    function convertDateFormat(dateString) {
        const [day, month, year] = dateString.split('.');
        return `${year}-${month}-${day}`;
    }

    return (
        <div {...props}>
            <div className="relative group inline-flex items-center">
                {isEditing ? (
                    <div className='flex'>
                        <input
                            ref={inputRef}
                            type={inputType}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="rounded-md, px-1 transition-width duration-300"
                            style={{ width: inputType === 'text' ? inputWidth : 'auto' }}
                        />
                        <FormatButton onClick={handleConfirmClick}>
                            <CheckIcon className="w-3 h-3" />
                        </FormatButton>
                        <FormatButton onClick={handleCancelClick}>
                            <XMarkIcon className="w-3 h-3" />
                        </FormatButton>
                    </div>
                ) : (
                    <div className='flex flex-wrap'>
                        <div className='flex items-center px-1' ref={textRef} >{initialText}</div>
                        <FormatButton
                            className="opacity-0 transform -translate-x-full transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0"
                            onClick={handleEditClick}
                        >
                            <PencilIcon className="w-3 h-3" />
                        </FormatButton>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RichInput;