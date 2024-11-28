import React, { useContext, useState } from 'react';
import Select, { components } from 'react-select';
import { DBContext } from '../../store/db-context';
import { AppContext } from '../../store/app-context';
import ActionButton from '../common/ActionButton';

const ArticleList = ({ onArticleChange, excludedArticleIds, onViewClicked }) => {

    const CustomOption = (props) => {

        const handleViewClicked = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('View clicked');
            onViewClicked(props.data.id);
        }

        return (
            <components.Option {...props}>
                <div className="flex justify-between items-center w-full p-2">
                    <div className="flex justify-between">
                        <span>{(props.data.ownerName ? props.data.ownerName + ' | ' : '') + props.data.title + ' | ' + props.data.dateStr}</span>
                    </div>
                    <ActionButton color='blue' onClick={handleViewClicked}>{t('view')}</ActionButton>
                </div>
            </components.Option>
        );
    };

    const customStyles = {
        control: (base) => ({
            ...base,
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            boxShadow: 'none',
            '&:hover': {
                border: '1px solid #007bff',
            },
        }),
        option: (base, state) => {
            const border = state.isFocused ? '2px solid' : 'none';
            const backgroundColor = '#fff';
            const color = '#333';

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
            // color: state.data.color || '#333',
        }),
    };

    const { allArticles, getOwnerById } = useContext(DBContext);
    const { translate: t } = useContext(AppContext);

    const articleOptions = [
        ...allArticles.filter(article => !excludedArticleIds || !excludedArticleIds.includes(article.id)).map(article => {

            const title = article.title;
            const ownerName = article.ownerId && getOwnerById(article.ownerId).name;
            const dateStr = article.date.toLocaleDateString('tr');
            return {
                id: article.id,
                title: title,
                ownerName: ownerName,
                dateStr: dateStr,
                label: (ownerName ? ownerName + ' | ' : '') + title,
            }
        })
    ];

    const [selectedArticle, setSelectedArticle] = useState();

    const handleChange = (selectedOption) => {
        setSelectedArticle(selectedOption);
        onArticleChange(selectedOption.id);
    };

    return (
        <div className="flex gap-2 w-full">
            <Select
                value={selectedArticle}
                options={articleOptions}
                onChange={handleChange}
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
