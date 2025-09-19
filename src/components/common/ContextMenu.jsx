import React, { useEffect, useRef } from 'react';

const ContextMenu = ({ isOpen, onClose, position, children }) => {

    const contextMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);


    return (
        <>
            {isOpen &&
                <div className="absolute shadow-md p-1 rounded-md"
                    style={{ 
                        top: `${position.top}px`, 
                        left: `${position.left}px`, 
                        zIndex: 1000,
                        backgroundColor: 'var(--bg-secondary)',
                        border: '5px solid var(--border-secondary)'
                    }}
                    // style={{ top: 0, left: 0 }}
                    ref={contextMenuRef}>
                    {children}
                </div>
            }
        </>
    );
};

export default ContextMenu;