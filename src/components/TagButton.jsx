export default function TagButton({children}) {
    return (
        <div className="inline-block rounded-lg mx-1 my-1 bg-green-200 p-0.5 shadow-lg">
            <button className="text-xs text-green-800 bg-white px-2 py-1 rounded-lg">{children}</button>  
        </div>
    );
}
