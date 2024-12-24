const ActionButton = ({ onClick, color='', size='', children }) => {
    let colorStyle = "bg-gray-200 hover:bg-gray-300 text-gray-700";

    if (color === 'green')
        colorStyle = "bg-green-500 hover:bg-green-600 text-gray-100";
    else if (color === 'red')
        colorStyle = "bg-red-500 hover:bg-red-600 text-gray-100";
    else if (color === 'blue')
        colorStyle = "bg-blue-500 hover:bg-blue-600 text-gray-100";
    else
        colorStyle = "bg-[#0C3B2E] hover:bg-[#1D4C3F] text-white";

    let sizeStyle = "text-lg px-2 py-1";

    if (size === 'small')
        sizeStyle = "text-sm px-2 py-1";
    else if (size === 'large')
        sizeStyle = "text-3xl px-5 py-3";

    return (
        <button
            className= {colorStyle + " rounded-md shadow-sm select-none " + sizeStyle}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

export default ActionButton;