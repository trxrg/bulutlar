import React, { useContext } from 'react';
import { DBContext } from '../../../../store/db-context';
import { SearchContext } from '../../../../store/search-context';
import ClassFiltering from './ClassFiltering';

const TagFiltering = () => {

    const { allTags } = useContext(DBContext);
    const { selectedTagNames, setSelectedTagNames } = useContext(SearchContext);

    const tagNames = allTags.map(tag => tag.name);

    return (
        <ClassFiltering
            allNames={tagNames}
            selectedNames={selectedTagNames}
            setSelectedNames={setSelectedTagNames}
        ></ClassFiltering>
    );
};

export default TagFiltering;