import React, { useContext } from 'react';
import { DBContext } from '../../../../store/db-context';
import { SearchContext } from '../../../../store/search-context';
import { AppContext } from '../../../../store/app-context';
import ClassFiltering from './ClassFiltering';

const OwnerFiltering = () => {

    const { translate: t } = useContext(AppContext);
    const { allOwners } = useContext(DBContext);
    const { selectedOwnerNames, setSelectedOwnerNames } = useContext(SearchContext);

    const ownerNames = allOwners.map(owner => owner.name);

    return (
        <ClassFiltering
            label={t('owner')}
            allNames={ownerNames}
            selectedNames={selectedOwnerNames}
            setSelectedNames={setSelectedOwnerNames}
        ></ClassFiltering>
    );
};

export default OwnerFiltering;