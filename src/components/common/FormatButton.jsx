const FormatButton = ({ onClick, onMouseDown, wfixed = true, title='', children, ...props }) => {
    return (
        <div {...props}>
            <button
                className={(wfixed ? "w-10 " : "px-2 ") + "flex items-center justify-center h-10 rounded-md shadow-sm select-none"}
                style={{
                    backgroundColor: 'var(--button-bg)',
                    color: 'var(--text-primary)',
                    transition: 'background-color 0.2s ease',
                    border: 'none',
                    outline: 'none'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--button-hover)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--button-bg)'}
                onMouseDown={onMouseDown}
                onClick={onClick}
                title={title}
            >
                {children}
            </button>
        </div>
    );
}

export default FormatButton;