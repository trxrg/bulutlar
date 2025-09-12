const ActionButton = ({ onClick, color='', size='', title='', children }) => {
    let colorStyle = {};

    if (color === 'green') {
        colorStyle = {
            backgroundColor: '#059669',
            color: '#f9fafb',
            fontWeight: 'bold'
        };
    } else if (color === 'red') {
        colorStyle = {
            backgroundColor: '#B53A16',
            color: '#f9fafb',
            fontWeight: 'bold'
        };
    } else if (color === 'blue') {
        colorStyle = {
            backgroundColor: 'var(--border-primary)',
            color: '#f9fafb',
            fontWeight: 'bold'
        };
    } else {
        colorStyle = {
            backgroundColor: 'var(--border-primary)',
            color: '#f9fafb',
            fontWeight: 'bold'
        };
    }

    let sizeStyle = "text-lg px-2 py-1";

    if (size === 'small')
        sizeStyle = "text-sm px-2 py-1";
    else if (size === 'large')
        sizeStyle = "text-3xl px-5 py-3";

    return (
        <button
            className={"rounded-md shadow-sm select-none " + sizeStyle}
            style={{
                ...colorStyle,
                transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
                e.target.style.filter = 'brightness(1.1)';
            }}
            onMouseLeave={(e) => {
                e.target.style.filter = 'brightness(1)';
            }}
            onClick={onClick}
            title={title || children}
        >
            {children}
        </button>
    );
}

export default ActionButton;