const FormatButton = ({ onClick, wfixed = true, children, ...props }) => {
    return (
        <div {...props}>
            <button
                className={(wfixed ? "w-10 " : "px-2 ") + "flex items-center justify-center h-10 m-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md shadow-sm select-none"}
                onMouseDown={onClick}
            >
                {children}
            </button>
        </div>
    );
}

export default FormatButton;