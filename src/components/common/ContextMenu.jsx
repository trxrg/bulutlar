import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

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

    // Auto-close the context menu whenever any react-modal opens. react-modal adds
    // the `ReactModal__Body--open` class to <body>, so we observe that class and
    // call onClose when it appears (so the menu doesn't float over the modal).
    useEffect(() => {
        if (!isOpen || typeof document === 'undefined') return;
        if (document.body.classList.contains('ReactModal__Body--open')) {
            onClose();
            return;
        }
        const observer = new MutationObserver(() => {
            if (document.body.classList.contains('ReactModal__Body--open')) {
                onClose();
            }
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, [isOpen, onClose]);


    if (!isOpen) return null;

    return createPortal(
        <div className="fixed shadow-md p-1 rounded-md"
            style={{ 
                top: `${position.top}px`, 
                left: `${position.left}px`, 
                zIndex: 9999,
                backgroundColor: 'var(--bg-secondary)',
                border: '5px solid var(--border-secondary)'
            }}
            ref={contextMenuRef}>
            {children}
        </div>,
        document.body
    );
};

export default ContextMenu;