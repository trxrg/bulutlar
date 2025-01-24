import React, { useContext } from 'react';
import DateFiltering from './DateFiltering';
import { SearchContext } from '../../../../store/search-context';

const Date1Filtering = () => {
    const { startDate, endDate, setStartDate, setEndDate } = useContext(SearchContext);

    return (
        <DateFiltering
            startDate={startDate}
            endDate={endDate}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
        />
    );
};

export default Date1Filtering;