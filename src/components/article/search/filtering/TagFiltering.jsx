import React, { useContext } from 'react';
import { DBContext } from '../../../../store/db-context';
import { SearchContext } from '../../../../store/search-context';

const TagFiltering = () => {

    const { allTags } = useContext(DBContext);
    const { selectedTagNames, setSelectedTagNames } = useContext(SearchContext);

    const tagNames = allTags.map(tag => tag.name);

    const handleTagChange = (event) => {
        const { value, checked } = event.target;
        if (checked)
            setSelectedTagNames(prevSelectedTagNames => [...prevSelectedTagNames, value]);
        else
            setSelectedTagNames(prevSelectedTagNames => prevSelectedTagNames.filter((tagName) => tagName !== value));
    };

    return (
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
        </div>
    );
};

export default TagFiltering;