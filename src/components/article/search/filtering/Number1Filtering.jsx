import React, { useContext } from 'react';
import { SearchContext } from '../../../../store/search-context';
import ClassFiltering from './ClassFiltering';

const Number1Filtering = () => {

    const { selectedNumbers1, setSelectedNumbers1 } = useContext(SearchContext);

    return (
        <ClassFiltering
            allNames={['1', '2', '3', '4', '5', '6', '7', '8', '9']}
            selectedNames={selectedNumbers1}
            setSelectedNames={setSelectedNumbers1}
        ></ClassFiltering>
    );
};

export default Number1Filtering;