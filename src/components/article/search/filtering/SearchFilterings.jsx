import React from 'react';
import OwnerFiltering from './OwnerFiltering.jsx';
import TagFiltering from './TagFiltering.jsx';
import CategoryFiltering from './CategoryFiltering.jsx';
import KeywordFiltering from './KeywordFiltering.jsx';

const SearchFilterings = () => {
    return (
        <div className="flex flex-col gap-4 p-4 overflow-auto">
            <KeywordFiltering />
            <CategoryFiltering />
            <OwnerFiltering />
            <TagFiltering />
        </div>
    );
};

export default SearchFilterings;
