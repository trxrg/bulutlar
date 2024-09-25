import React, { useState, useRef, useEffect } from 'react';

const CustomSelect = () => {
    const [selectedColor, setSelectedColor] = useState('Red');
    const [showList, setShowList] = useState(false);

    const dropdownRef = useRef(null);

    const handleItemSelect = (event) => {
        event.preventDefault();
        setSelectedColor(event.target.value);
        setShowList(false);
    };

    const handleClickOutside = (event) => {
        event.preventDefault();
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setShowList(false); // Hide the dropdown if clicked outside
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button className="block w-full text-left p-2 border rounded bg-white shadow" onClick={(event) => {event.preventDefault();setShowList(true)}}>
                {selectedColor}
            </button>
            {showList &&
                <div className="absolute left-0 mt-1 w-full bg-white border rounded shadow-lg z-10">
                    <ul className="max-h-60 overflow-y-auto">
                        {['Red', 'Green', 'Blue'].map((color) => (
                            <li
                                key={color}
                                onClick={handleItemSelect}
                                className={`cursor-pointer p-2 hover:bg-blue-500 hover:text-white ${selectedColor === color ? 'bg-blue-500 text-white' : ''
                                    }`}
                            >
                                {color}
                            </li>
                        ))}
                    </ul>
                </div>}
        </div>
    );
};

export default CustomSelect;
