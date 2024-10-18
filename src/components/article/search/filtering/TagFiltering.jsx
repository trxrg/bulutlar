import React, { useContext } from 'react';
import { DBContext } from '../../../../store/db-context';
import { SearchContext } from '../../../../store/search-context';
import { AppContext } from '../../../../store/app-context';

const TagFiltering = () => {

    const { translate: t } = useContext(AppContext);
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
        <div className='bg-stone-50 p-1 rounded-md'>
            <label className="my-2">{t('tag')}:</label>
            <div className="overflow-auto max-h-40">
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