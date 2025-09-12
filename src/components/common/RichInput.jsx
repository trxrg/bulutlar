import React, { useState, useEffect, useRef } from 'react';
import { CheckIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';
import FormatButton from './FormatButton';

const RichInput = ({ initialText, handleSave, inputType = 'text', hasEditButton = false, onClick = undefined, style, ...props }) => {
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
        confirm();
    };

    const confirm = async () => {
        await handleSave(inputValue);
        setIsEditing(false);
    }

    const handleCancelClick = (e) => {
        e.stopPropagation();
        cancel();
    };

    const cancel = () => {
        setIsEditing(false);
        setInputValue(inputType === 'date' ? convertDateFormat(initialText) : initialText);
    }

    function convertDateFormat(dateString) {
        const [day, month, year] = dateString.split('.');
        return `${year}-${month}-${day}`;
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            confirm();
        } else if (e.key === 'Escape') {
            cancel();
        }
    };

    const handleClick = () => {
        if (onClick) {
            onClick();
        }
    }

    useEffect(() => {
        if (isEditing) {
            inputRef.current.addEventListener('keydown', handleKeyDown);
        } else {
            inputRef.current?.removeEventListener('keydown', handleKeyDown);
        }

        return () => {
            inputRef.current?.removeEventListener('keydown', handleKeyDown);
        };
    }, [isEditing, handleKeyDown]);

    return (
        <div {...props} style={{ ...style, color: style?.color || 'inherit' }}>
            <div className="relative group inline-flex items-center">
                <div className='flex'>
                    {isEditing ?
                        <div className={'flex flex-wrap ml-1 gap-1 w-full'}>
                            <input
                                ref={inputRef}
                                type={inputType}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                className="rounded-md p-1"
                                style={{
                                    minWidth: inputWidth,
                                    backgroundColor: 'var(--bg-primary)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border-secondary)'
                                }}
                            />
                            <FormatButton onClick={handleConfirmClick}>
                                <CheckIcon className="w-5 h-5" />
                            </FormatButton>
                            <FormatButton onClick={handleCancelClick}>
                                <XMarkIcon className="w-5 h-5" />
                            </FormatButton>
                        </div>
                        :
                        hasEditButton ?
                            <div className={'flex flex-wrap ml-1 gap-1 w-full'}>
                                <p className='flex items-center cursor-pointer hover:underline'
                                    onClick={handleClick}
                                    style={{ color: 'var(--text-primary)' }}>
                                    {initialText}
                                </p>
                                <FormatButton onClick={handleEditClick} className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <PencilIcon className="w-5 h-5" />
                                </FormatButton>
                            </div>
                            : <div className=''
                                onClick={handleEditClick}
                                ref={textRef}
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {initialText}
                            </div>
                    }
                </div>
            </div>
        </div>
    );
};

export default RichInput;