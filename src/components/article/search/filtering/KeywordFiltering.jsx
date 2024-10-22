import React, { useContext, useState } from 'react';
import ActionButton from '../../../common/ActionButton';
import { SearchContext } from '../../../../store/search-context';
import { useTranslation } from 'react-i18next';

const KeywordFiltering = () => {

    const { t } = useTranslation();
    const { keywords, setKeywords } = useContext(SearchContext);
    const [inputValue, setInputValue] = useState('');

    const handleAddKeyword = () => {
        if (inputValue.trim() !== '') {
            setKeywords([...keywords, inputValue]);
            setInputValue('');
        }
    };

    const handleRemoveKeyword = (indexToRemove) => {
        setKeywords(keywords.filter((_, index) => index !== indexToRemove));
    };

    return (
        <div className='bg-stone-50 p-1 rounded-md'>
            <label className="my-2">{t('keyword')}:</label>
            <div className="flex flex-wrap justify-between p-1 overflow-auto max-h-40">
                <input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                />
                <ActionButton onClick={handleAddKeyword}>{t('add')}</ActionButton>
            </div>
            <ul>
                {keywords.map((keyword, index) => (
                    <li key={index}>
                        <div className='flex justify-between'>
                            <p>{keyword}</p>
                            <ActionButton onClick={() => handleRemoveKeyword(index)}>{t('remove')}</ActionButton>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default KeywordFiltering;
