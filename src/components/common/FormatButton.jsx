const FormatButton = ({ onClick, onMouseDown, wfixed = true, children, ...props }) => {
    return (
        <div {...props}>
            <button
                className={(wfixed ? "w-10 " : "px-2 ") + "flex items-center justify-center h-10 bg-stone-200 hover:bg-stone-10 text-stone-400 hover:text-stone-700 rounded-md shadow-sm select-none"}
                onMouseDown={onMouseDown}
                onClick={onClick}
            >
                {children}
            </button>
        </div>
    );
}

export default FormatButton;