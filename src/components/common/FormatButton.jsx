const FormatButton = ({ onClick, onMouseDown, wfixed = true, children, ...props }) => {
    return (
        <div {...props}>
            <button
                className={(wfixed ? "w-8 " : "px-2 ") + "flex items-center justify-center h-8 hover:bg-[#F8FDE9] text-stone-700 rounded-md shadow-sm select-none"}
                onMouseDown={onMouseDown}
                onClick={onClick}
            >
                {children}
            </button>
        </div>
    );
}

export default FormatButton;