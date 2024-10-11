const ActionButton = ({ onClick, color='', children }) => {
    let colorStyle = "bg-gray-200 hover:bg-gray-300 text-gray-700";

    if (color === 'green')
        colorStyle = "bg-green-500 hover:bg-green-600 text-gray-100";
    else if (color === 'red')
        colorStyle = "bg-red-500 hover:bg-red-600 text-gray-100";
    else if (color === 'blue')
        colorStyle = "bg-blue-500 hover:bg-blue-600 text-gray-100";

    return (
        <button
            className= {colorStyle + " flex items-center justify-center h-10 px-2 rounded-md shadow-sm select-none"}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

export default ActionButton;