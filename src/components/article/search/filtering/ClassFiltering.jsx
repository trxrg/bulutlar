import React, { useState, useContext } from 'react';
import { AppContext } from '../../../../store/app-context';

const ClassFiltering = ({ label, allNames, selectedNames, setSelectedNames }) => {
    
    const { translate: t } = useContext(AppContext);
    const [filterText, setFilterText] = useState('');

    const handleChange = (event) => {
        const { value, checked } = event.target;
        if (checked)
            setSelectedNames(prevSelectedNames => [...prevSelectedNames, value]);
        else
            setSelectedNames(prevSelectedNames => prevSelectedNames.filter((name) => name !== value));
    };

    const handleFilterChange = (event) => {
        setFilterText(event.target.value);
    };

    const filteredNames = allNames.filter(name => normalizeText(name).includes(normalizeText(filterText)));

    function normalizeText(text) {
        if (!text) return '';
        if (typeof text !== 'string') return text;
        const turkishMap = { 
            'ç': 'c', 'Ç': 'C', 
            'ğ': 'g', 'Ğ': 'G', 
            'ı': 'i', 'İ': 'I', 
            'ö': 'o', 'Ö': 'O', 
            'ş': 's', 'Ş': 'S', 
            'ü': 'u', 'Ü': 'U' 
        };
        const result = text.split('').map(char => turkishMap[char] || char).join('').toLowerCase();
        return result;
    };

    return (
        <div className='flex flex-col bg-stone-50 py-1 px-2 rounded-md border-2 border-red-300'>
            <div className='flex flex-shrink-0 pb-1'>
                <label>{label} ({filteredNames.length}):</label>
            </div>
            <input
                type="text"
                placeholder={t('filter by name')}
                value={filterText}
                onChange={handleFilterChange}
                className="mb-2 p-1 border rounded"
            />
            <div className="flex flex-col flex-1 overflow-auto max-h-40">
                {filteredNames.map((name) => (
                    <div key={name} className="mb-2">
                        <label className="inline-flex items-center">
                            <input
                                type="checkbox"
                                value={name}
                                checked={selectedNames.includes(name)}
                                onChange={handleChange}
                            />
                            <span className="ml-2">{name}</span>
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClassFiltering;