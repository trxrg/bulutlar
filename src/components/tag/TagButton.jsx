export default function TagButton({ handleClose, isCloseable, label }) {
    return (
        <div className="inline-block inline-flex items-center cursor-pointer text-md py-2 px-3 m-1 rounded-xl shadow-md tag-button group"
             style={{
                 color: 'var(--text-primary)'
             }}
        >
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
