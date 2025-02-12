import React, { useState, useContext } from 'react';
import TagButton from './TagButton.jsx';
import { articleApi } from '../../backend-adapter/BackendAdapter.js';
import { DBContext } from '../../store/db-context.jsx';
import { AppContext } from '../../store/app-context.jsx';
import { ReadContext } from '../../store/read-context.jsx';
import ActionButton from '../common/ActionButton.jsx';

const TagList2 = ({ showInput = true }) => {

    const { allTags, fetchAllTags, fetchArticleById, getTagById } = useContext(DBContext);
    const { article } = useContext(ReadContext);
    const { translate: t } = useContext(AppContext);

    const suggestedTagNumber = 5;
    const tags = article.tags.map(tag => getTagById(tag.id));
    const [inputValue, setInputValue] = useState('');
    const suggestedTags = allTags;

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleAddTag = async (tagNameToAdd) => {
        setInputValue('');
        if (tagNameToAdd.length > 0 && !tags.map(tag => tag.name).includes(tagNameToAdd)) {
            await articleApi.addTag(article.id, tagNameToAdd);
            await fetchAllTags();
            await fetchArticleById(article.id);
        }
    };

    const handleRemoveTag = async (tagNameToRemove) => {
        await articleApi.removeTag(article.id, tagNameToRemove);
        await fetchArticleById(article.id);
    };

    return (
        <div className='p-2 w-full'>
            {showInput && <div className='flex gap-2'>
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder={t('type a tag') + '...'}
                    className="w-[40%] shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
                <ActionButton onClick={() => handleAddTag(inputValue)} color='blue'>{t('add')}</ActionButton>
            </div>}
            {inputValue.length > 0 &&
                <div>
                    <span>{t('suggested tags')}: </span>
                    {suggestedTags
                        .filter(tag => tag.name.toLowerCase().includes(inputValue.toLowerCase()))
                        .filter(tag => !tags.map(t => t.name).includes(tag.name))
                        .slice(0, suggestedTagNumber)
                        .map(tag => (
                            <span key={tag.id} >
                                <button onClick={() => handleAddTag(tag.name)}
                                    className='px-2 m-1 border'>{tag.name}
                                </button>
                            </span>
                        ))}
                </div>}
            <div className='my-2'>
                {tags.map(tag => (
                    <TagButton key={tag.id} isCloseable={true} handleClose={handleRemoveTag} label={tag.name}></TagButton>
                ))}
            </div>
        </div>
    );
};

export default TagList2;
