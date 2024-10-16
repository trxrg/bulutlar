import React from 'react';
import OwnerFiltering from './OwnerFiltering.jsx';
import TagFiltering from './TagFiltering.jsx';

const SearchFilterings = () => {      
    return (
        <div className="p-4 overflow-auto">
            <div className="mb-4">
                <TagFiltering />
                <OwnerFiltering />                
            </div>            
        </div>
    );
};

export default SearchFilterings;
