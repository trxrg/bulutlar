export default function TagButton({ handleClose, isCloseable, label }) {
    return (
        <div className="inline-flex items-center cursor-pointer text-sm font-medium py-2 px-3 m-1 rounded-lg shadow-sm hover:shadow-md tag-button group transition-all duration-200 hover:scale-105"
             style={{
                 color: 'var(--text-primary)',
                 backgroundColor: 'var(--bg-secondary)',
                 border: '1px solid var(--border-secondary)',
                 boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
             }}
        >
            <div className="flex items-center">
                <span className="text-sm font-medium">
                    {label}
                </span>
            </div>
            {isCloseable && <button
                className="ml-2 text-red-500 hover:text-red-700 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
                onClick={(e) => {
                    e.stopPropagation(); // Prevent tab click event from firing
                    handleClose(label);
                }}
            >×</button>}
        </div>
    );
}
