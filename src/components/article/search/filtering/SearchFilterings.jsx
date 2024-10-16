import React from 'react';
import OwnerFiltering from './OwnerFiltering.jsx';
import TagFiltering from './TagFiltering.jsx';
import CategoryFiltering from './CategoryFiltering.jsx';

const SearchFilterings = () => {
    return (
        <div className="p-4 overflow-auto">
            <div className="mb-4">
                <CategoryFiltering />
                <OwnerFiltering />
                <TagFiltering />
            </div>
        </div>
    );
};

export default SearchFilterings;
