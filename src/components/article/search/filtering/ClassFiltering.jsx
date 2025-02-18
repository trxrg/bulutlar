import React, { useState, useContext } from 'react';
import { AppContext } from '../../../../store/app-context';

const ClassFiltering = ({ allNames, selectedNames, setSelectedNames }) => {

    const { translate: t, normalizeText } = useContext(AppContext);
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

    return (
        <div className='flex flex-col'>
            <div className='flex flex-row'>
                <input
                    type="text"
                    placeholder={t('filter')}
                    value={filterText}
                    onChange={handleFilterChange}
                    className="flex flex-1 mb-2 p-1 border rounded"
                />
                <div className='flex flex-shrink-0 mx-2'>
                    <label>({filteredNames.length})</label>
                </div>
            </div>
            <div className="flex flex-col overflow-auto max-h-40">
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