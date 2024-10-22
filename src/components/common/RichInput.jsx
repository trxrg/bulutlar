import React, { useState, useEffect, useRef } from 'react';
import {CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
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

    const handleEditClick = (e) => {
        e.stopPropagation();
        setIsEditing(true);
    };

    const handleConfirmClick = (e) => {
        e.stopPropagation();
        setIsEditing(false);
        handleSave(inputValue);
    };

    const handleCancelClick = (e) => {
        e.stopPropagation();
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
                <div className='flex'>
                    {isEditing ? (
                        <input
                            ref={inputRef}
                            type={inputType}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="rounded-md, px-1"
                            style={{ minWidth: inputType === 'text' ? inputWidth : 'auto' }}
                        />)
                        :
                        (<div className='px-1'
                            onClick={handleEditClick}
                            ref={textRef} >{initialText}</div>
                        )}
                    <div className={`flex ml-1 gap-1 ' + ${isEditing ? 'opacity-100' : 'opacity-0'}`}>
                        <FormatButton onClick={handleConfirmClick}>
                            <CheckIcon className="w-3 h-3" />
                        </FormatButton>
                        <FormatButton onClick={handleCancelClick}>
                            <XMarkIcon className="w-3 h-3" />
                        </FormatButton>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default RichInput;