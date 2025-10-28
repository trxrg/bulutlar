import Tooltip from '@mui/material/Tooltip';

const FormatButton = ({ onClick, onMouseDown, wfixed = true, title='', children, ...props }) => {
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

    // Wrap with MUI Tooltip
    return (
        <Tooltip title={title} arrow placement="top">
            {button}
        </Tooltip>
    );
}

export default FormatButton;