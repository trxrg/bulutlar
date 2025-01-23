import React, { useContext } from 'react';
import { DBContext } from '../../../../store/db-context';
import { SearchContext } from '../../../../store/search-context';
import ClassFiltering from './ClassFiltering';

const OwnerFiltering = () => {

    const { allOwners } = useContext(DBContext);
    const { selectedOwnerNames, setSelectedOwnerNames } = useContext(SearchContext);

    const ownerNames = allOwners.map(owner => owner.name);

    return (
        <ClassFiltering
            allNames={ownerNames}
            selectedNames={selectedOwnerNames}
            setSelectedNames={setSelectedOwnerNames}
        ></ClassFiltering>
    );
};

export default OwnerFiltering;