import React from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import BodyWithFixedHeader from './BodyWithFixedHeader';
import FormatButton from './FormatButton';

const CollapsiblePanel = ({ 
    isCollapsed, 
    onToggleCollapse, 
    title, 
    onTitleClick, 
    headerButtons = [], 
    children
}) => {
    return (
        <div className='h-full'>
            <BodyWithFixedHeader>
                <div className='flex flex-wrap justify-between p-2 shadow-lg items-center' style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <h2 
                        className='ml-2 text-xl font-semibold cursor-pointer hover:underline' 
                        style={{ color: 'var(--text-primary)' }} 
                        onClick={onTitleClick}
                    >
                        {title}
                    </h2>
                    <div className='flex items-center gap-1'>
                        {!isCollapsed && headerButtons.map((button, index) => (
                            <FormatButton key={index} onClick={button.onClick} title={button.title}>
                                {button.icon}
                            </FormatButton>
                        ))}
                        {onToggleCollapse && (
                            <FormatButton onClick={onToggleCollapse} title={isCollapsed ? 'Expand panel' : 'Collapse panel'}>
                                {isCollapsed ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                            </FormatButton>
                        )}
                    </div>
                </div>
                {!isCollapsed && children}
            </BodyWithFixedHeader>
        </div>
    );
};

export default CollapsiblePanel;
