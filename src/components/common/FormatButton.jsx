const FormatButton = ({ onClick, wfixed = true, children, ...props }) => {
    return (
        <div {...props}>
            <button
                className={(wfixed ? "w-10 " : "px-2 ") + "flex items-center justify-center h-10 m-1 bg-[#0C3B2E] hover:bg-[#1D4C3F] text-white rounded-md shadow-sm select-none"}
                onMouseDown={onClick}
            >
                {children}
            </button>
        </div>
    );
}

export default FormatButton;