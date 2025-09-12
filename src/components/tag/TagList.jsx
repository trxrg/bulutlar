import React, { useState, useContext } from 'react';
import TagButton from './TagButton.jsx';

import { DBContext } from '../../store/db-context.jsx';
import { AppContext } from '../../store/app-context.jsx';
import ActionButton from '../common/ActionButton.jsx';

const TagList = React.forwardRef(({ selectedTags, onTagsChange }, ref) => {

    const { allTags } = useContext(DBContext);
    const { translate: t } = useContext(AppContext);

    const suggestedTagNumber = 5;
    const [tags, setTags] = useState(selectedTags);
    const [inputValue, setInputValue] = useState('');
    const suggestedTags = allTags;

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleAddTag = (tagNameToAdd) => {
        setInputValue('');
        if (tagNameToAdd.length > 0 && !tags.map(tag => tag.name).includes(tagNameToAdd)) {
            const newTags = [...tags, { name: tagNameToAdd }];
            onTagsChange(newTags);
            setTags(newTags);
        }
    };

    const handleRemoveTag = (tagNameToRemove) => {
        const newTags = tags.filter(tag => tag.name !== tagNameToRemove);
        onTagsChange(newTags);
        setTags(newTags);
    };

    const reset = () => {
        setTags([]);
    }

    React.useImperativeHandle(ref, () => ({
        reset
    }));

    return (
        <div>
            <div className='flex gap-2'>
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder={t('type tags') + '...'}
                    className="w-[40%] shadow appearance-none rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline"
                    style={{
                        border: '1px solid var(--border-secondary)',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)'
                    }}
                />
                <ActionButton onClick={() => handleAddTag(inputValue)} color='blue'>{t('add')}</ActionButton>
            </div>
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
            <div>
                {tags.map(tag => (
                    <TagButton key={tag.id} isCloseable={true} handleClose={handleRemoveTag} label={tag.name}></TagButton>
                ))}
            </div>
        </div>
    );
});

export default TagList;
