import React, { useState } from 'react';
import TagButton from '../components/TagButton';

const TagList = React.forwardRef(({ allTags, onTagsChange }, ref) => {
    const suggestedTagNumber = 5;
    const [tags, setTags] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const suggestedTags = allTags;

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleTagClick = (tag) => {
        setInputValue('');
        if (tag.length > 0 && !tags.includes(tag)) {
            const newTags = [...tags, tag];
            onTagsChange(newTags);
            setTags(newTags);
        }
    };

    const handleTagRemove = (tagToRemove) => {
        const newTags = tags.filter(tag => tag !== tagToRemove);
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
            <label className="block text-gray-700 font-bold mb-2" htmlFor="mainText">Tags:</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="Type tags..."
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
                <button type="button" onClick={() => handleTagClick(inputValue)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 mx-2 rounded focus:outline-none focus:shadow-outline">Add</button>
            </div>
            <div>
                {suggestedTags
                    .filter(tag => tag.toLowerCase().includes(inputValue.toLowerCase()))
                    .filter(tag => !tags.includes(tag))
                    .slice(0, suggestedTagNumber)
                    .map(tag => (
                        <span key={tag} onClick={() => handleTagClick(tag)}>
                            <button className='mx-2'>{tag}</button>
                        </span>
                    ))}
            </div>
            <div>
                {tags.map(tag => (
                    <span key={tag} onClick={() => handleTagRemove(tag)}>
                        <TagButton cls="text-xl">{tag}</TagButton>
                    </span>
                ))}
            </div>
        </div>
    );
});

export default TagList;
