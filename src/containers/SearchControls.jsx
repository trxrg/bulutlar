import React, { useState, useEffect } from 'react';

const SearchControls = ({ tags, owners, onFilterChanged }) => {
    const [selectedOwners, setSelectedOwners] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [keyword, setKeyword] = useState('');

    useEffect(() => {
        handleFilterChanged();
    }, [selectedOwners, selectedTags]);

    const handleOwnerChange = (event) => {        
        const { value, checked } = event.target;
        if (checked)
            setSelectedOwners(prevSelectedOwners => [...prevSelectedOwners, value]);
        else
            setSelectedOwners(prevSelectedOwners => prevSelectedOwners.filter((owner) => owner !== value));
    };
    
    const handleTagChange = (event) => {        
        const { value, checked } = event.target;
        if (checked)
            setSelectedTags(prevSelectedTags => [...prevSelectedTags, value]);
        else
            setSelectedTags(prevSelectedTags => prevSelectedTags.filter((tag) => tag !== value));
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

    function handleFilterChanged() {
        onFilterChanged({
            owners: selectedOwners,
            tags: selectedTags,
            startDate,
            endDate,
            keyword,
        });
    };

    return (
        <div className="p-4 bg-gray-200">
            <div className="mb-4">
                <label className="mr-2">Tag:</label>
                <div className="overflow-y-scroll max-h-40">
                    {tags.map((tag) => (
                        <div key={tag} className="mb-2">
                            <label className="inline-flex items-center">
                                <input
                                    type="checkbox"
                                    value={tag}
                                    checked={selectedTags.includes(tag)}
                                    onChange={handleTagChange}
                                    className="mr-1"
                                />
                                <span
                                    className={selectedTags.includes(tag) ? "bg-blue-200 rounded px-2 py-1" : ""}
                                >{tag}</span>
                            </label>
                        </div>
                    ))}
                </div>
                <label className="mr-2">Owner:</label>
                <div className="overflow-y-scroll max-h-40">
                    {owners.map((owner) => (
                        <div key={owner} className="mb-2">
                            <label className="inline-flex items-center">
                                <input
                                    type="checkbox"
                                    value={owner}
                                    checked={selectedOwners.includes(owner)}
                                    onChange={handleOwnerChange}
                                    className="mr-1"
                                />
                                <span
                                    className={selectedOwners.includes(owner) ? "bg-blue-200 rounded px-2 py-1" : ""}
                                >{owner}</span>
                            </label>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex mb-4">
                <label className="mr-2">Start Date:</label>
                <input
                    type="date"
                    className="border rounded px-2 py-1"
                    value={startDate}
                    onChange={handleStartDateChange}
                />
            </div>
            <div className="flex mb-4">
                <label className="mr-2">End Date:</label>
                <input
                    type="date"
                    className="border rounded px-2 py-1"
                    value={endDate}
                    onChange={handleEndDateChange}
                />
            </div>
            <div className="flex mb-4">
                <label className="mr-2">Keyword:</label>
                <input
                    type="text"
                    className="border rounded px-2 py-1"
                    value={keyword}
                    onChange={handleKeywordChange}
                />
                <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleFilterChanged}>
                    Search
                </button>
            </div>
        </div>
    );
};

export default SearchControls;