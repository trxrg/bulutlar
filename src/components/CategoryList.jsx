import React, { useState } from "react";

const customInputLabel = 'new';
const CategoryList = React.forwardRef(({ categories, onCategoryChange }, ref) => {

    const [isShowTextInput, setIsShowTextInput] = useState(false);
    const [customInput, setCustomInput] = useState('');
    const [activeValue, setActiveValue] = useState('');

    const handleSelectChange = (event) => {

        const value = event.target.value;
        if (value === customInputLabel) {
            setIsShowTextInput(true);
        } else {
            setActiveValue(value);
            onCategoryChange(value);
        }
    };

    const handleCustomInputChange = (event) => {
        setCustomInput(event.target.value);
    }

    const handleCustomInputSubmit = (event) => {
        event.preventDefault();

        setIsShowTextInput(false);
        event.target.value = customInput;
        handleSelectChange(event);
    }

    const handleNewCategoryCancel = (event) => {
        event.preventDefault();
        setCustomInput('');
        setIsShowTextInput(false);
    }

    const reset = () => {
       setIsShowTextInput(false);
        setCustomInput('');
        setActiveValue('');
    }

    React.useImperativeHandle(ref, () => ({
        reset
    }));

    return (
        <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2" htmlFor="category">Category:</label>
            {!isShowTextInput && <select
                id="category"
                value={activeValue}
                onChange={handleSelectChange}
                required
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
                {customInput.length > 0 ? <option value={customInput}>{customInput}</option> : <option value="">Select Category</option>}
                {categories.map((category, index) => (
                    <option key={index} value={category}>
                        {category}
                    </option>
                ))}
                <option value={customInputLabel}>{customInputLabel}</option>
            </select>}
            {isShowTextInput && (
                <div>
                    <input type="text" value={customInput} onChange={handleCustomInputChange} onBlur={handleCustomInputSubmit} placeholder="Enter new category"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                    <button onClick={handleCustomInputSubmit} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 mx-2 rounded focus:outline-none focus:shadow-outline">Submit</button>
                    <button onClick={handleNewCategoryCancel} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 mx-2 rounded focus:outline-none focus:shadow-outline">Cancel</button>
                </div>
            )}
        </div>
    );
});

export default CategoryList;
