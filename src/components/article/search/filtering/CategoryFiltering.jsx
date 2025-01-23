import React, { useContext } from 'react';
import { DBContext } from '../../../../store/db-context';
import { AppContext } from '../../../../store/app-context';
import { SearchContext } from '../../../../store/search-context';
import ClassFiltering from './ClassFiltering';

const CategoryFiltering = () => {

    const { translate: t } = useContext(AppContext);
    const { allCategories } = useContext(DBContext);
    const { selectedCategoryNames, setSelectedCategoryNames } = useContext(SearchContext);

    const categoryNames = allCategories.map(cat => cat.name);

    return (
        <ClassFiltering
            label={t('category')}
            allNames={categoryNames}
            selectedNames={selectedCategoryNames}
            setSelectedNames={setSelectedCategoryNames}
        ></ClassFiltering>
    );
};

export default CategoryFiltering;