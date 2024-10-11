import React, { useState, useContext } from 'react';
import AddLinkModal from '../../common/AddLinkModal.jsx';
import { LinkIcon, PencilIcon, PhotoIcon, PencilSquareIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { ReadContext } from '../../../store/read-context.jsx';
import FormatButton from '../../common/FormatButton.jsx';
import ActionButton from '../../common/ActionButton.jsx';

const ReadControls = () => {

    const { increaseFontSize, decreaseFontSize, toggleStyle, setEditable, editable, saveContent, resetContent, addImage, rightPanelCollapsed, setRightPanelCollapsed, leftPanelCollapsed, setLeftPanelCollapsed } = useContext(ReadContext);

    const [isLinkModalOpen, setLinkModalOpen] = useState(false);

    const handleToggleStyle = (event, style) => {
        event.preventDefault();
        toggleStyle(style);
    }

    return (
        <div className='flex justify-between py-2'>
            <div className='flex space-x-2'>
                {leftPanelCollapsed ?
                    <FormatButton onClick={() => setLeftPanelCollapsed(false)}>
                        <ChevronRightIcon className="w-4 h-4" />
                    </FormatButton>
                    :
                    <FormatButton onClick={() => setLeftPanelCollapsed(true)}>
                        <ChevronLeftIcon className="w-4 h-4" />
                    </FormatButton>}
                <FormatButton onClick={decreaseFontSize}>A-</FormatButton>
                <FormatButton onClick={increaseFontSize}>A+</FormatButton>
                <FormatButton onClick={(e) => handleToggleStyle(e, 'BOLD')}><strong>B</strong></FormatButton>
                <FormatButton onClick={(e) => handleToggleStyle(e, 'UNDERLINE')}><u>U</u></FormatButton>
                <FormatButton onClick={(e) => handleToggleStyle(e, 'HIGHLIGHT')}><span className='bg-yellow-100'>H</span></FormatButton>
                <FormatButton onClick={() => setLinkModalOpen(true)}><LinkIcon className="w-4 h-4" /></FormatButton>
                <FormatButton onClick={addImage}><PhotoIcon className="w-4 h-4" /></FormatButton>
                <FormatButton><PencilSquareIcon className="w-4 h-4" /></FormatButton>
            </div>
            <div className='flex space-x-2'>
                {editable ?
                    <div className='flex space-x-2'>
                        <ActionButton
                            onClick={() => { saveContent(); setEditable(false); }}
                            color={'blue'}>
                            Save
                        </ActionButton>
                        <ActionButton
                            onClick={() => { resetContent(); setEditable(false); }}
                            color={'red'}>
                            Cancel
                        </ActionButton>
                    </div>
                    :
                    <FormatButton
                        onClick={() => setEditable(true)}
                    ><PencilIcon className="w-4 h-4" /></FormatButton>}
                {rightPanelCollapsed ?
                    <FormatButton onClick={() => setRightPanelCollapsed(false)}>
                        <ChevronLeftIcon className="w-4 h-4" />
                    </FormatButton>
                    :
                    <FormatButton onClick={() => setRightPanelCollapsed(true)}>
                        <ChevronRightIcon className="w-4 h-4" />
                    </FormatButton>}
            </div>
            <AddLinkModal
                isOpen={isLinkModalOpen}
                onClose={() => setLinkModalOpen(false)}
            />
        </div>
    );
};

export default ReadControls;
