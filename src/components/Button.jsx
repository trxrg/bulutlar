const Button = ({ color, children }) => {
    return (
        <>
            {color === 'green' && <button className="bg-green-600 text-white py-2 px-4 mx-2 rounded-md hover:bg-green-700 focus:outline-none"></button>}
            {color === 'red' && <button className="bg-red-700 text-white py-2 px-4 mx-2 rounded-md hover:bg-red-500 focus:outline-none"></button>}
            {color === 'blue' && <button className="bg-blue-700 text-white py-2 px-4 mx-2 rounded-md hover:bg-blue-500 focus:outline-none"></button>}
        </>
    );
}