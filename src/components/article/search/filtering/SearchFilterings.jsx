import React, { useContext, useState } from 'react';
import OwnerFiltering from './OwnerFiltering.jsx';
import TagFiltering from './TagFiltering.jsx';
import CategoryFiltering from './CategoryFiltering.jsx';
import GroupFiltering from './GroupFiltering.jsx';
import KeywordFiltering from './KeywordFiltering.jsx';
import { AppContext } from '../../../../store/app-context.jsx';
import { SearchContext } from '../../../../store/search-context.jsx';
import Date1Filtering from './Date1Filtering.jsx';
import Date2Filtering from './Date2Filtering.jsx';
import Number1Filtering from './Number1Filtering.jsx';
import Number2Filtering from './Number2Filtering.jsx';
import FilterAccordion from './FilterAccordion.jsx';
import SavedFiltersAccordion from './SavedFiltersAccordion.jsx';
import SaveFilterModal from './SaveFilterModal.jsx';
import BodyWithFixedHeader from '../../../common/BodyWithFixedHeader';
import SearchFilteringsHeader from './SearchFilteringsHeader.jsx';
import Checkbox from '@mui/material/Checkbox';

const SearchFilterings = () => {

    const { translate: t } = useContext(AppContext);
    const { keywords, setKeywords,
        selectedCategoryNames, setSelectedCategoryNames,
        selectedGroupNames, setSelectedGroupNames,
        selectedOwnerNames, setSelectedOwnerNames,
        selectedTagNames, setSelectedTagNames,
        startDate, setStartDate,
        endDate, setEndDate,
        startDate2, setStartDate2,
        endDate2, setEndDate2,
        selectedNumbers1, setSelectedNumbers1,
        selectedNumbers2, setSelectedNumbers2,
        filterStarred, setFilterStarred,
        saveFilter } = useContext(SearchContext);

    const [isSaveFilterModalOpen, setIsSaveFilterModalOpen] = useState(false);

    const isDate1Active = startDate.day || startDate.month || startDate.year || endDate.day || endDate.month || endDate.year;
    const isDate2Active = startDate2.day || startDate2.month || startDate2.year || endDate2.day || endDate2.month || endDate2.year;
    const clearDate1 = () => {
        setStartDate({ day: '', month: '', year: '' });
        setEndDate({ day: '', month: '', year: '' });
    }
    const clearDate2 = () => {
        setStartDate2({ day: '', month: '', year: '' });
        setEndDate2({ day: '', month: '', year: '' });
    }

    const handleSaveFilter = (filterName) => {
        saveFilter(filterName);
    };

    const handleClearAllFilters = () => {
        setKeywords([]);
        setSelectedCategoryNames([]);
        setSelectedGroupNames([]);
        setSelectedOwnerNames([]);
        setSelectedTagNames([]);
        clearDate1();
        clearDate2();
        setSelectedNumbers1([]);
        setSelectedNumbers2([]);
        setFilterStarred(false);
    };

    return (
        <div className='h-full'>
            <BodyWithFixedHeader>
                <SearchFilteringsHeader 
                    onSaveFilter={() => setIsSaveFilterModalOpen(true)}
                    onClearAll={handleClearAllFilters}
                />

                <div className="h-full overflow-y-auto overflow-x-hidden">
                    <div className='flex flex-col p-3' style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                        <label className={'select-none cursor-pointer'}>
                            <Checkbox
                                checked={filterStarred}
                                onChange={(e) => setFilterStarred(e.target.checked)}
                                sx={{
                                    color: 'var(--text-primary)',
                                }}
                            />
                            {t('starred')}
                        </label>
                    </div>
                    <SavedFiltersAccordion />
                    <FilterAccordion title={t('keyword')} isFilterActive={keywords && keywords.length > 0} clearFilter={() => setKeywords([])}>
                        <KeywordFiltering />
                    </FilterAccordion>
                    <FilterAccordion title={t('category')} isFilterActive={selectedCategoryNames && selectedCategoryNames.length > 0} clearFilter={() => setSelectedCategoryNames([])}>
                        <CategoryFiltering />
                    </FilterAccordion>
                    <FilterAccordion title={t('group')} isFilterActive={selectedGroupNames && selectedGroupNames.length > 0} clearFilter={() => setSelectedGroupNames([])}>
                        <GroupFiltering />
                    </FilterAccordion>
                    <FilterAccordion title={t('owner')} isFilterActive={selectedOwnerNames && selectedOwnerNames.length > 0} clearFilter={() => setSelectedOwnerNames([])}>
                        <OwnerFiltering />
                    </FilterAccordion>
                    <FilterAccordion title={t('tag')} isFilterActive={selectedTagNames && selectedTagNames.length > 0} clearFilter={() => setSelectedTagNames([])}>
                        <TagFiltering />
                    </FilterAccordion>
                    <FilterAccordion title={t('gregorian date')} isFilterActive={isDate1Active} clearFilter={clearDate1}>
                        <Date1Filtering />
                    </FilterAccordion>
                    <FilterAccordion title={t('hijri date')} isFilterActive={isDate2Active} clearFilter={clearDate2}>
                        <Date2Filtering />
                    </FilterAccordion>
                    <FilterAccordion title={t('gregorian number')} isFilterActive={selectedNumbers1 && selectedNumbers1.length > 0} clearFilter={() => setSelectedNumbers1([])}>
                        <Number1Filtering />
                    </FilterAccordion>
                    <FilterAccordion title={t('hijri number')} isFilterActive={selectedNumbers2 && selectedNumbers2.length > 0} clearFilter={() => setSelectedNumbers2([])}>
                        <Number2Filtering />
                    </FilterAccordion>
                </div>
            </BodyWithFixedHeader>
            <SaveFilterModal
                isOpen={isSaveFilterModalOpen}
                onRequestClose={() => setIsSaveFilterModalOpen(false)}
                onConfirm={handleSaveFilter}
            />
        </div>
    );
};

export default SearchFilterings;


