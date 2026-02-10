const ActionButton = ({ onClick, color='', size='', title='', children }) => {
    let colorStyle = {};

    if (color === 'green') {
        colorStyle = {
            backgroundColor: 'var(--border-primary)',
            color: '#f9fafb',
            fontWeight: '600'
        };
    } else if (color === 'red') {
        colorStyle = {
            backgroundColor: '#b91c1c',
            color: '#fef2f2',
            fontWeight: '600'
        };
    } else {
        // default: theme green (same as border-primary)
        colorStyle = {
            backgroundColor: 'var(--border-primary)',
            color: '#f9fafb',
            fontWeight: '600'
        };
    }

    let sizeStyle = "text-lg px-3 py-1 h-10";

    if (size === 'small')
        sizeStyle = "text-sm px-2 py-1 h-8";
    else if (size === 'large')
        sizeStyle = "text-2xl px-5 py-3 h-12";

    return (
        <button
            className={"rounded-md shadow-sm select-none action-button " + sizeStyle}
            style={{
                ...colorStyle,
                fontWeight: '500'
            }}
            onClick={onClick}
            title={title || children}
        >
            {children}
        </button>
    );
}

export default ActionButton;