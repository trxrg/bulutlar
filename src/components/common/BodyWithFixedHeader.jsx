import React from 'react';

const BodyWithFixedHeader = ({ children, ...props }) => {
    const [header, body] = React.Children.toArray(children);

    return (
        <div className='flex flex-col h-full ' {...props}>
            <div className="flex-shrink-0 relative z-10">
                {header}
            </div>
            <div className="flex-1 overflow-y-auto relative z-0">
                {body}
            </div>
        </div>
    );
};

export default BodyWithFixedHeader;
