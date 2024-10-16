import React, { useContext } from 'react';
import { DBContext } from '../../../../store/db-context';
import { SearchContext } from '../../../../store/search-context';

const CategoryFiltering = () => {

    const { allCategories } = useContext(DBContext);
    const { selectedCategoryNames, setSelectedCategoryNames } = useContext(SearchContext);

    const categoryNames = allCategories.map(cat => cat.name);

    const handleFilterChange = (event) => {
        const { value, checked } = event.target;
        if (checked)
            setSelectedCategoryNames(prevSelectedCategoryNames => [...prevSelectedCategoryNames, value]);
        else
            setSelectedCategoryNames(prevSelectedCategoryNames => prevSelectedCategoryNames.filter((catName) => catName !== value));
    };

    return (
        <div className='bg-stone-50 p-1 rounded-md'>
            <label className="my-2">Category:</label>
            <div className="overflow-auto max-h-40">
                {categoryNames.map(catName => (
                    <div key={catName} className="mb-2">
                        <label className="inline-flex items-center">
                            <input
                                type="checkbox"
                                value={catName}
                                checked={selectedCategoryNames.includes(catName)}
                                onChange={handleFilterChange}
                                className="mr-1"
                            />
                            <span
                                className={selectedCategoryNames.includes(catName) ? "bg-blue-200 rounded px-2 py-1" : ""}
                            >{catName}</span>
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CategoryFiltering;