import { useContext } from 'react';
import Tooltip from '@mui/material/Tooltip';
import { AppContext } from '../../store/app-context';

const FormatButton = ({ onClick, onMouseDown, wfixed = true, title='', children, ...props }) => {
    const { fullScreen } = useContext(AppContext);
    
    const button = (
        <div {...props}>
            <button
                className={(wfixed ? "w-10 " : "px-2 ") + "flex items-center justify-center h-10 rounded-md shadow-sm select-none format-button"}
                onMouseDown={onMouseDown}
                onClick={onClick}
            >
                {children}
            </button>
        </div>
    );

    // If no title provided, return button without tooltip
    if (!title) {
        return button;
    }

    // Skip Tooltip when in fullscreen mode to avoid MUI warnings.
    // When parent components (like ReadControls or tabs bar) are hidden with display:none
    // in fullscreen, MUI Tooltip's anchorEl becomes invalid and logs warnings:
    // "The anchor element should be part of the document layout"
    if (fullScreen) {
        return button;
    }

    // Wrap with MUI Tooltip
    return (
        <Tooltip title={title} arrow placement="top">
            {button}
        </Tooltip>
    );
}

export default FormatButton;