import React, { useContext, useState, useEffect } from 'react';
import Select, { components } from 'react-select';
import { DBContext } from '../../store/db-context';
import { AppContext } from '../../store/app-context';
import { normalizeText } from '../../utils/textUtils.js';
import ActionButton from '../common/ActionButton';

const ArticleList = ({ onArticleChange, excludedArticleIds, onViewClicked, clearSearch }) => {

    const CustomOption = (props) => {

        const handleViewClicked = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('View clicked');
            onViewClicked(props.data.id);
        }

        return (
            <components.Option {...props}>
                <div className="flex justify-between items-center w-full p-2 group">
                    <div className="flex justify-between">
                        <span>{(props.data.ownerName ? props.data.ownerName + ' | ' : '') + props.data.title + ' | ' + props.data.dateStr}</span>
                    </div>
                    {/* <div className='opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                        <ActionButton onClick={handleViewClicked}>{t('view')}</ActionButton>
                    </div> */}
                </div>
            </components.Option>
        );
    };

    const customStyles = {
        control: (base) => ({
            ...base,
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-secondary)',
            color: 'var(--text-primary)',
            boxShadow: 'none',
            '&:hover': {
                border: '1px solid var(--border-primary)',
            },
        }),
        option: (base, state) => {
            const border = state.isFocused ? '2px solid var(--border-primary)' : 'none';
            const backgroundColor = state.isFocused ? 'var(--bg-tertiary)' : 'var(--bg-primary)';
            const color = 'var(--text-primary)';

            return {
                ...base,
                backgroundColor,
                color,
                border,
                cursor: 'pointer'
            };
        },
        singleValue: (base, state) => ({
            ...base,
            color: 'var(--text-primary)',
        }),
        menu: (base) => ({
            ...base,
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-secondary)',
        }),
        placeholder: (base) => ({
            ...base,
            color: 'var(--text-tertiary)',
        }),
        input: (base) => ({
            ...base,
            color: 'var(--text-primary)',
        }),
    };

    const { allArticles, getOwnerById } = useContext(DBContext);
    const { translate: t } = useContext(AppContext);

    const articleOptions = [
        ...allArticles.filter(article => !excludedArticleIds || !excludedArticleIds.includes(article.id)).map(article => {

            const title = article.title;
            const ownerName = article.ownerId && getOwnerById(article.ownerId).name;
            const dateStr = article.isDateUncertain ? '' : article.date.toLocaleDateString('tr');
            return {
                id: article.id,
                title: title,
                ownerName: ownerName,
                dateStr: dateStr,
                label: (ownerName ? ownerName + ' | ' : '') + title,
                value: normalizeText((ownerName ? ownerName + ' | ' : '') + title),
            }
        })
    ];

    const [selectedArticle, setSelectedArticle] = useState();
    const [inputValue, setInputValue] = useState('');

    // Handle external clear search request
    useEffect(() => {
        if (clearSearch) {
            setInputValue('');
            setSelectedArticle(null);
        }
    }, [clearSearch]);

    const handleChange = (selectedOption) => {
        setSelectedArticle(selectedOption);
        onArticleChange(selectedOption.id);
        // Don't clear the input value - keep the search prompt
    };

    const handleInputChange = (newInputValue, { action }) => {
        // Only update input value when user is typing, not when selecting
        if (action === 'input-change') {
            setInputValue(newInputValue);
        }
    };

    return (
        <div className="flex gap-2 w-full">
            <Select
                value={selectedArticle}
                options={articleOptions}
                onChange={handleChange}
                inputValue={inputValue}
                onInputChange={handleInputChange}
                components={{ Option: CustomOption }} // Use the custom option
                className="react-select flex-1"
                classNamePrefix="select"
                styles={customStyles}
                placeholder={t('select article')}
                noOptionsMessage={() => t('no such article')}
            />
        </div>
    );
};

export default ArticleList;
