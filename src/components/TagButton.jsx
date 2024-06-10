export default function TagButton({handleClick, cls, children}) {
    return (
        <div className="inline-block rounded-lg mx-1 my-1 bg-green-200 p-0.5 shadow-lg">
            <button type="button" onClick={handleClick} className= {cls + " text-green-800 bg-white px-2 py-1 rounded-lg"}>{children}</button>  
        </div>
    );
}
