import React, { useContext, useState } from 'react';
import FormatButton from '../../../common/FormatButton';
import { SearchContext } from '../../../../store/search-context';
import { useTranslation } from 'react-i18next';
import Checkbox from '@mui/material/Checkbox';
import toastr from 'toastr';

import { XMarkIcon, PlusIcon } from '@heroicons/react/24/solid';

const KeywordFiltering = () => {

    const { t } = useTranslation();
    const { keywords, setKeywords, searchInTitle,
        searchInExplanation, searchInMainText, searchInComments,
        setSearchInTitle, setSearchInExplanation, setSearchInMainText, setSearchInComments } = useContext(SearchContext);
    const [inputValue, setInputValue] = useState('');

    const handleAddKeyword = () => {
        if (!inputValue) return;

        const trimmed = inputValue.trim();

        if (trimmed.length >= 2) {
            setKeywords([...keywords, trimmed]);
            setInputValue('');
        } else {
            toastr.warning(t('enter at least 2 characters'));
        }
    };

    const handleRemoveKeyword = (indexToRemove) => {
        setKeywords(keywords.filter((_, index) => index !== indexToRemove));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleAddKeyword();
        }
    };

    const handleCheckboxChange = (setter) => (event) => {
        setter(event.target.checked);
    };

    const checkboxStyle = 'select-none cursor-pointer';

    return (
        <div className='p-1 flex flex-col overflow-auto max-h-80' style={{ color: 'var(--text-primary)' }}>
            <div className="flex flex-col mb-3">
                <label className={checkboxStyle}>
                    <Checkbox
                        checked={searchInTitle}
                        onChange={handleCheckboxChange(setSearchInTitle)}
                        sx={{
                            color: 'var(--text-primary)',
                        }}
                    />
                    {t('title')}
                </label>
                <label className={checkboxStyle}>
                    <Checkbox
                        checked={searchInExplanation}
                        onChange={handleCheckboxChange(setSearchInExplanation)}
                        sx={{
                            color: 'var(--text-primary)',
                        }}
                    />
                    {t('explanation')}
                </label>
                <label className={checkboxStyle}>
                    <Checkbox
                        checked={searchInMainText}
                        onChange={handleCheckboxChange(setSearchInMainText)}
                        sx={{
                            color: 'var(--text-primary)',
                        }}
                    />
                    {t('main text')}
                </label>
                <label className={checkboxStyle}>
                    <Checkbox
                        checked={searchInComments}
                        onChange={handleCheckboxChange(setSearchInComments)}
                        sx={{
                            color: 'var(--text-primary)',
                        }}
                    />
                    {t('comment')}
                </label>
            </div>
            <div className="flex flex-wrap mb-3">
                <input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className='flex-1 p-1 rounded'
                    style={{
                        border: '1px solid var(--border-secondary)',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)'
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={t('enter keyword')}
                />
                <div className='flex flex-shrink-0 ml-1'>
                    <FormatButton onClick={handleAddKeyword}><PlusIcon className="w-5 h-5" /></FormatButton>
                </div>
            </div>
            <ul>
                {keywords.map((keyword, index) => (
                    <li key={index}>
                        <div className='flex justify-between py-1' style={{ borderTop: '1px solid var(--border-secondary)' }}>
                            <p style={{ color: 'var(--text-primary)' }}>{keyword}</p>
                            <FormatButton onClick={() => handleRemoveKeyword(index)}><XMarkIcon className="w-4 h-4" /></FormatButton>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default KeywordFiltering;
