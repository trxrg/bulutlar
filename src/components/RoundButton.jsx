const RoundButton = ({ onClick, color='', children }) => {
    let colorStyle = "bg-gray-200 hover:bg-gray-300 text-gray-700";

    if (color === 'green')
        colorStyle = "bg-green-500 hover:bg-green-600 text-gray-100";
    else if (color === 'red')
        colorStyle = "bg-red-500 hover:bg-red-600 text-gray-100";
    else if (color === 'blue')
        colorStyle = "bg-blue-500 hover:bg-blue-600 text-gray-100";

    return (
        <button
            className= {colorStyle + " text-white p-3 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 flex items-center justify-center"}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

export default RoundButton;