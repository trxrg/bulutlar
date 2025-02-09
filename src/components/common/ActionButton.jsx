const ActionButton = ({ onClick, color='', size='', children }) => {
    let colorStyle = "bg-gray-200 hover:bg-gray-300 text-gray-700";

    if (color === 'green')
        colorStyle = "bg-green-500 hover:bg-green-600 text-gray-100";
    else if (color === 'red')
        colorStyle = "bg-[#B53A16] hover:bg-red-600 text-gray-100";
    else if (color === 'blue')
        colorStyle = "bg-[#338879] hover:bg-[#44998A] text-gray-100";
    else
        colorStyle = "bg-[#338879] hover:bg-[#44998A] text-gray-200";

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