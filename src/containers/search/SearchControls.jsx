import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../store/app-context.jsx'

const SearchControls = ({ onFilterChanged }) => {

    const { allOwners, allTags } = useContext(AppContext);

    const tagNames=allTags.map(tag=>tag.name);
    const ownerNames=allOwners.map(owner=>owner.name);

    const [selectedOwnerNames, setSelectedOwnerNames] = useState([]);
    const [selectedTagNames, setSelectedTagNames] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [keyword, setKeyword] = useState('');
    const [endDateDifferent, setEndDateDifferent] = useState(false);

    useEffect(() => {
        handleFilterChanged();
    }, [selectedOwnerNames, selectedTagNames]);

    const handleOwnerChange = (event) => {
        const { value, checked } = event.target;
        if (checked)
            setSelectedOwnerNames(prevSelectedOwnerNames => [...prevSelectedOwnerNames, value]);
        else
            setSelectedOwnerNames(prevSelectedOwnerNames => prevSelectedOwnerNames.filter((ownerName) => ownerName !== value));
    };  

    const handleTagChange = (event) => {
        const { value, checked } = event.target;
        if (checked)
            setSelectedTagNames(prevSelectedTagNames => [...prevSelectedTagNames, value]);
        else
            setSelectedTagNames(prevSelectedTagNames => prevSelectedTagNames.filter((tagName) => tagName !== value));
    };

    const handleStartDateChange = (event) => {
        setStartDate(event.target.value);
    };

    const handleEndDateChange = (event) => {
        setEndDate(event.target.value);
    };

    const handleKeywordChange = (event) => {
        setKeyword(event.target.value);
    };

    const handleEndDateDifferentChange = () => {
        setEndDateDifferent(prev => !prev);
    }

    function handleFilterChanged() {
        onFilterChanged({
            ownerNames: selectedOwnerNames,
            tagNames: selectedTagNames,
            startDate,
            endDate,
            keyword,
        });
    };


    return (
        <div className="p-4 overflow-auto">
            <div className="mb-4">
                <label className="my-2">Tag:</label>
                <div className="overflow-auto max-h-40 p-1 my-2 border border-green-200">
                    {tagNames.map(tagName => (
                        <div key={tagName} className="mb-2">
                            <label className="inline-flex items-center">
                                <input
                                    type="checkbox"
                                    value={tagName}
                                    checked={selectedTagNames.includes(tagName)}
                                    onChange={handleTagChange}
                                    className="mr-1"
                                />
                                <span
                                    className={selectedTagNames.includes(tagName) ? "bg-blue-200 rounded px-2 py-1" : ""}
                                >{tagName}</span>
                            </label>
                        </div>
                    ))}
                </div>
                <label className="mr-2">Owner:</label>
                <div className="overflow-auto max-h-40 border border-green-200">
                    {ownerNames.map((ownerName) => (
                        <div key={ownerName} className="mb-2">
                            <label className="inline-flex items-center">
                                <input
                                    type="checkbox"
                                    value={ownerName}
                                    checked={selectedOwnerNames.includes(ownerName)}
                                    onChange={handleOwnerChange}
                                    className="mr-1"
                                />
                                <span
                                    className={selectedOwnerNames.includes(ownerName) ? "bg-blue-200 rounded px-2 py-1" : ""}
                                >{ownerName}</span>
                            </label>
                        </div>
                    ))}
                </div>
            </div>
            <div className="mb-4">
                <label className="mr-2">Start Date:</label>
                <input
                    type="date"
                    className="border rounded px-2 py-1"
                    value={startDate}
                    onChange={handleStartDateChange}
                />
            </div>
            <div className='inline-flex items-center'>
                <input
                    type="checkbox"
                    value={endDateDifferent ? 'Same end date' : 'Different end date'}
                    checked={endDateDifferent}
                    onChange={handleEndDateDifferentChange}
                    className="mr-1"
                />
                <span>Different end date</span>
            </div>
            {endDateDifferent && <div className="mb-4">
                <label className="mr-2">End Date:</label>
                <input
                    type="date"
                    className="border rounded px-2 py-1"
                    value={endDateDifferent ? endDate : startDate}
                    onChange={handleEndDateChange}
                />
            </div>}
            <div className="my-4">
                <label>Keyword:</label>
                <input
                    type="text"
                    className="border rounded px-2 py-1"
                    value={keyword}
                    onChange={handleKeywordChange}
                />
                <button className="bg-blue-500 text-white mt-1 px-2 py-1 rounded" onClick={handleFilterChanged}>
                    Search
                </button>
            </div>
        </div>
    );
};

export default SearchControls;
