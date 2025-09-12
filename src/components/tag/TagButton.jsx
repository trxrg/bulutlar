export default function TagButton({ handleClose, isCloseable, label }) {
    return (
        <div className="inline-block inline-flex items-center cursor-pointer text-md py-2 px-3 m-1 rounded-xl shadow-md transition duration-300 ease-in-out group"
             style={{
                 backgroundColor: 'var(--bg-tertiary)',
                 color: 'var(--text-primary)'
             }}
             onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-stone)'}
             onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
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
