import React from 'react';

const ClassFiltering = ({ label, allNames, selectedNames, setSelectedNames }) => {

    const handleChange = (event) => {
        const { value, checked } = event.target;
        if (checked)
            setSelectedNames(prevSelectedNames => [...prevSelectedNames, value]);
        else
            setSelectedNames(prevSelectedNames => prevSelectedNames.filter((name) => name !== value));
    };

    return (
        <div className='flex flex-col bg-stone-50 p-1 rounded-md'>
            <div className='flex flex-shrink-0'>
                <label className="mr-2 border-b-2">{label}:</label>
            </div>
            <div className="flex flex-col flex-1 overflow-auto max-h-40">
                {allNames && allNames.map((name) => (
                    <div key={name} className="mb-2">
                        <label className="inline-flex items-center">
                            <input
                                type="checkbox"
                                value={name}
                                checked={selectedNames.includes(name)}
                                onChange={handleChange}
                                className="mr-1"
                            />
                            <span
                                className={selectedNames.includes(name) ? "bg-blue-200 rounded px-2 py-1" : ""}
                            >{name}</span>
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClassFiltering;