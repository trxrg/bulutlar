export default function TagButton({ handleClose, isCloseable, label }) {
    return (
        <div className="inline-block inline-flex items-center cursor-pointer bg-[#E7ECD8] hover:bg-[#F8FDE9] text-stone-700 font-bold py-1 px-2 m-1 rounded-xl shadow-md transition duration-300 ease-in-out group">
            <div>
                <h2>
                    {label}
                </h2>
            </div>
            {isCloseable && <button
                className="ml-2 text-red-700 hover:text-red-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                onClick={(e) => {
                    e.stopPropagation(); // Prevent tab click event from firing
                    handleClose(label);
                }}
            >&#10006;</button>}
        </div>
    );
}
