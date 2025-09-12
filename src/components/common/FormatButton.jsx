const FormatButton = ({ onClick, onMouseDown, wfixed = true, title='', children, ...props }) => {
    return (
        <div {...props}>
            <button
                className={(wfixed ? "w-10 " : "px-2 ") + "flex items-center justify-center h-10 rounded-md shadow-sm select-none format-button"}
                onMouseDown={onMouseDown}
                onClick={onClick}
                title={title}
            >
                {children}
            </button>
        </div>
    );
}

export default FormatButton;