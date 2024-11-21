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
                <div className="absolute bg-white border border-gray-300 shadow-md p-1"
                    style={{ top: `${position.top}px`, left: `${position.left}px`, zIndex: 1000 }}
                    // style={{ top: 0, left: 0 }}
                    ref={contextMenuRef}>
                    {children}
                </div>
            }
        </>
    );
};

export default ContextMenu;