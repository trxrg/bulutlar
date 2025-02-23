import React, { useContext } from 'react';
import { DBContext } from '../../../../store/db-context';
import { SearchContext } from '../../../../store/search-context';
import ClassFiltering from './ClassFiltering';

const GroupFiltering = () => {

    const { allGroups } = useContext(DBContext);
    const { selectedGroupNames, setSelectedGroupNames } = useContext(SearchContext);
    
    const groupNames = allGroups.map(group => group.name);

    return (
        <ClassFiltering
            allNames={groupNames}
            selectedNames={selectedGroupNames}
            setSelectedNames={setSelectedGroupNames}
        ></ClassFiltering>
    );
};

export default GroupFiltering;