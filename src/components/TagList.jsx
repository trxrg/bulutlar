import React, { useState } from 'react';
import TagButton from './TagButton';

const TagList = React.forwardRef(({ allTags, selectedTags, onTagsChange }, ref) => {
    const suggestedTagNumber = 5;
    const [tags, setTags] = useState(selectedTags);
    const [inputValue, setInputValue] = useState('');
    const suggestedTags = allTags;

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleAddTag = (tagNameToAdd) => {
        setInputValue('');
        if (tagNameToAdd.length > 0 && !tags.map(tag=>tag.name).includes(tagNameToAdd)) {
            const newTags = [...tags, {name: tagNameToAdd}];
            onTagsChange(newTags);
            setTags(newTags);
        }
    };
    
    const handleRemoveTag = (tagToRemove) => {
        const newTags = tags.filter(tag => tag.name !== tagToRemove.name);
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
            <div>
                {suggestedTags
                    .filter(tag => tag.name.toLowerCase().includes(inputValue.toLowerCase()))
                    .filter(tag => !tags.map(t=>t.name).includes(tag.name))
                    .slice(0, suggestedTagNumber)
                    .map(tag => (
                        <span key={tag.id} onClick={() => handleAddTag(tag.name)}>
                            <button className='mx-2'>{tag.name}</button>
                        </span>
                    ))}
            </div>
            <div>
                {tags.map(tag => (
                    <span key={tag.id} onClick={() => handleRemoveTag(tag)}>
                        <TagButton cls="text-xl">{tag.name}</TagButton>
                    </span>
                ))}
            </div>
        </div>
    );
});

export default TagList;
