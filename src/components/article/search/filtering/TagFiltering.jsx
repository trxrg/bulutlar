import React, { useContext } from 'react';
import { DBContext } from '../../../../store/db-context';
import { SearchContext } from '../../../../store/search-context';
import { AppContext } from '../../../../store/app-context';
import ClassFiltering from './ClassFiltering';

const TagFiltering = () => {

    const { translate: t } = useContext(AppContext);
    const { allTags } = useContext(DBContext);
    const { selectedTagNames, setSelectedTagNames } = useContext(SearchContext);

    const tagNames = allTags.map(tag => tag.name);

    return (
        <ClassFiltering
            label={t('tag')}
            allNames={tagNames}
            selectedNames={selectedTagNames}
            setSelectedNames={setSelectedTagNames}
        ></ClassFiltering>
    );
};

export default TagFiltering;