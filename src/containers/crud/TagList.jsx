import React, { useState, useContext } from 'react';
import TagButton from './TagButton.jsx';

import { AppContext } from '../../store/app-context.jsx';

const TagList = React.forwardRef(({ selectedTags, onTagsChange }, ref) => {

    const { allTags } = useContext(AppContext);

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
            <label className="block text-gray-700 text-xl font-bold mb-2" htmlFor="mainText">Tags</label>
            <div className='flex'>
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="Type tags..."
                    className="w-[40%] shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
                <button type="button" onClick={() => handleAddTag(inputValue)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 mx-2 rounded focus:outline-none focus:shadow-outline">Add</button>
            </div>
            {inputValue.length > 0 &&
                <div>
                    {suggestedTags
                        .filter(tag => tag.name.toLowerCase().includes(inputValue.toLowerCase()))
                        .filter(tag => !tags.map(t => t.name).includes(tag.name))
                        .slice(0, suggestedTagNumber)
                        .map(tag => (
                            <span key={tag.id} onClick={() => handleAddTag(tag.name)}>
                                <button className='mx-2'>{tag.name}</button>
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
