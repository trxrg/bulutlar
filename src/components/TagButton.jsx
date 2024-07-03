export default function TagButton({handleClick, cls, children}) {
    return (
        <div className="inline-block bg-indigo-400 hover:bg-indigo-600 text-white font-bold py-1 px-2 m-1 rounded-full shadow-md transition duration-300 ease-in-out">
            <button type="button" onClick={handleClick}>{children}</button>  
        </div>
    );
}
