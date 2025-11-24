import React, { useState, useContext } from 'react';
import { AppContext } from '../../../../store/app-context';
import { normalizeText } from '../../../../utils/textUtils.js';
import Checkbox from '@mui/material/Checkbox';

const ClassFiltering = ({ allNames, selectedNames, setSelectedNames }) => {

    const { translate: t } = useContext(AppContext);
    const [filterText, setFilterText] = useState('');

    const handleChange = (name) => (event) => {
        const checked = event.target.checked;
        if (checked)
            setSelectedNames(prevSelectedNames => [...prevSelectedNames, name]);
        else
            setSelectedNames(prevSelectedNames => prevSelectedNames.filter((n) => n !== name));
    };

    const handleFilterChange = (event) => {
        setFilterText(event.target.value);
    };

    const filteredNames = allNames?.filter(name => normalizeText(name)?.includes(normalizeText(filterText)));

    return (
        <div className='flex flex-col' style={{ color: 'var(--text-primary)' }}>
            <div className='flex flex-row'>
                <input
                    type="text"
                    placeholder={t('filter')}
                    value={filterText}
                    onChange={handleFilterChange}
                    className="flex flex-1 mb-2 p-1 rounded"
                    style={{
                        border: '1px solid var(--border-secondary)',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)'
                    }}
                />
                <div className='flex flex-shrink-0 mx-2'>
                    <label style={{ color: 'var(--text-secondary)' }}>({filteredNames.length})</label>
                </div>
            </div>
            <div className="flex flex-col overflow-auto max-h-40">
                {filteredNames.map((name) => (
                    <div key={name} className="mb-2">
                        <label className="inline-flex items-center cursor-pointer select-none">
                            <Checkbox
                                checked={selectedNames?.includes(name)}
                                onChange={handleChange(name)}
                                sx={{
                                    color: 'var(--text-primary)',
                                }}
                            />
                            <span className="ml-2" style={{ color: 'var(--text-primary)' }}>{name}</span>
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClassFiltering;