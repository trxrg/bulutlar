import React, { useContext } from 'react';
import DateFiltering from './DateFiltering';
import { SearchContext } from '../../../../store/search-context';

const Date2Filtering = () => {
    const { startDate2, endDate2, setStartDate2, setEndDate2 } = useContext(SearchContext);

    return (
        <DateFiltering
            startDate={startDate2}
            endDate={endDate2}
            setStartDate={setStartDate2}
            setEndDate={setEndDate2}
        />
    );
};

export default Date2Filtering;