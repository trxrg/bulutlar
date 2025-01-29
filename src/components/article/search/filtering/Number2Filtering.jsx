import React, { useContext } from 'react';
import { SearchContext } from '../../../../store/search-context';
import ClassFiltering from './ClassFiltering';

const Number2Filtering = () => {

    const { selectedNumbers2, setSelectedNumbers2 } = useContext(SearchContext);

    return (
        <ClassFiltering
            allNames={['1', '2', '3', '4', '5', '6', '7', '8', '9']}
            selectedNames={selectedNumbers2}
            setSelectedNames={setSelectedNumbers2}
        ></ClassFiltering>
    );
};

export default Number2Filtering;