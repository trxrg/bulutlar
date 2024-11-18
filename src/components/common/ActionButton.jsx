const ActionButton = ({ onClick, color='', children }) => {
    let colorStyle = "bg-gray-200 hover:bg-gray-300 text-gray-700";

    if (color === 'green')
        colorStyle = "bg-green-500 hover:bg-green-600 text-gray-100";
    else if (color === 'red')
        colorStyle = "bg-red-500 hover:bg-red-600 text-gray-100";
    else if (color === 'blue')
        colorStyle = "bg-blue-500 hover:bg-blue-600 text-gray-100";
    else
        colorStyle = "bg-[#0C3B2E] hover:bg-[#1D4C3F] text-white";

    return (
        <button
            className= {colorStyle + " px-2 py-1 rounded-md shadow-sm select-none text-lg"}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

export default ActionButton;