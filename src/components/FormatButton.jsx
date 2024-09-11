const FormatButton = ({ onClick, wfixed=true, children }) => {
    return (
        <button
            className= {(wfixed ? "w-10 " : "px-2 ") + "flex items-center justify-center h-10 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md shadow-sm"}
            onMouseDown={onClick}
        >
            {children}
        </button>
    );
}

export default FormatButton;