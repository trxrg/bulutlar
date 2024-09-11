const FormatButton = ({ onClick, children }) => {
    return (
        <button
            className="flex items-center justify-center w-10 h-10 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            onMouseDown={onClick}
        >
            {children}
        </button>
    );
}

export default FormatButton;