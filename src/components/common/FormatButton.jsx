const FormatButton = ({ onClick, onMouseDown, wfixed = true, title='', children, ...props }) => {
    return (
        <div {...props}>
            <button
                className={(wfixed ? "w-10 " : "px-2 ") + "flex items-center justify-center h-10 hover:bg-[#F8FDE9] text-stone-700 rounded-md shadow-sm select-none"}
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