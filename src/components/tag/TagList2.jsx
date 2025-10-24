import React, { useState, useContext } from 'react';
import TagButton from './TagButton.jsx';
import { articleApi } from '../../backend-adapter/BackendAdapter.js';
import { DBContext } from '../../store/db-context.jsx';
import { AppContext } from '../../store/app-context.jsx';
import { ReadContext } from '../../store/read-context.jsx';
import ActionButton from '../common/ActionButton.jsx';
import toastr from 'toastr';

const TagList2 = ({ showInput = true }) => {

    const { allTags, fetchAllTags, fetchArticleById, getTagById } = useContext(DBContext);
    const { article } = useContext(ReadContext);
    const { translate: t, normalizeText } = useContext(AppContext);

    const suggestedTagNumber = 5;
    const tags = article.tags.map(tag => getTagById(tag.id));
    const [inputValue, setInputValue] = useState('');
    const suggestedTags = allTags;

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleAddTag = async (tagNameToAdd) => {
        setInputValue('');
        tagNameToAdd = tagNameToAdd?.trim();
        if (!tagNameToAdd || tagNameToAdd.length <= 0) {
            toastr.error(t('tag name cannot be empty'));
            return;
        }

        if (!tags.map(tag => tag.name).includes(tagNameToAdd)) {
            await articleApi.addTag(article.id, tagNameToAdd);
            await fetchAllTags();
            await fetchArticleById(article.id);
        } else {
            toastr.info(t('this article already have this tag'));
        }
    };

    const handleRemoveTag = async (tagNameToRemove) => {
        await articleApi.removeTag(article.id, tagNameToRemove);
        await fetchArticleById(article.id);
    };

    return (
        <div className='p-2 w-full' style={{ color: 'var(--text-primary)' }}>
            {showInput && <div className='flex gap-2'>
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder={t('type a tag') + '...'}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleAddTag(inputValue);
                        }
                    }}
                    className="w-[40%] shadow appearance-none rounded w-full py-2 px-3 mb-1 leading-tight focus:outline-none focus:shadow-outline"
                    style={{
                        border: '1px solid var(--border-secondary)',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)'
                    }}
                />
                <ActionButton onClick={() => handleAddTag(inputValue)} color='blue'>{t('add')}</ActionButton>
            </div>}
            {inputValue.length > 0 &&
                <div>
                    <span style={{ color: 'var(--text-primary)' }}>{t('suggested tags')}: </span>
                    {suggestedTags
                        .filter(tag => normalizeText(tag.name).includes(normalizeText(inputValue)))
                        .filter(tag => !tags.map(t => t.name).includes(tag.name))
                        .slice(0, suggestedTagNumber)
                        .map(tag => (
                            <span key={tag.id} >
                                <button onClick={() => handleAddTag(tag.name)}
                                    className='px-2 m-1 rounded'
                                    style={{
                                        border: '1px solid var(--border-secondary)',
                                        backgroundColor: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)'
                                    }}
                                >{tag.name}
                                </button>
                            </span>
                        ))}
                </div>}
            <div>
                {tags.map(tag => (
                    <TagButton key={tag.id} isCloseable={true} handleClose={handleRemoveTag} label={tag.name}></TagButton>
                ))}
            </div>
        </div>
    );
};

export default TagList2;
