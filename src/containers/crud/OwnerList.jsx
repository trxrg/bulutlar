import React, { useState } from "react";

const customInputLabel = 'new';
const OwnerList = React.forwardRef(({ owners, onOwnerChange, selectedOwner }, ref) => {

    const [isShowTextInput, setIsShowTextInput] = useState(false);
    const [customInput, setCustomInput] = useState('');
    const [activeValue, setActiveValue] = useState(selectedOwner ? selectedOwner : '');

    const handleSelectChange = (event) => {

        const value = event.target.value;
        if (value === customInputLabel) {
            setIsShowTextInput(true);
        } else {
            setActiveValue(value);
            onOwnerChange(value);
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

    const handleNewOwnerCancel = (event) => {
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
            <label className="block text-gray-700 font-bold mb-2" htmlFor="owner">Owner:</label>
            {!isShowTextInput && <select
                id="owner"
                value={activeValue}
                onChange={handleSelectChange}
                required
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
                {customInput.length > 0 ? <option value={customInput}>{customInput}</option> : <option value="">Select Owner</option>}
                {owners.map((owner, index) => (
                    <option key={index} value={owner.name}>
                        {owner.name}
                    </option>
                ))}
                <option value={customInputLabel}>{customInputLabel}</option>
            </select>}
            {isShowTextInput && (
                <div>
                    <input type="text" value={customInput} onChange={handleCustomInputChange} onBlur={handleCustomInputSubmit} placeholder="Enter new owner"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                    <button onClick={handleCustomInputSubmit} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 mx-2 rounded focus:outline-none focus:shadow-outline">Submit</button>
                    <button onClick={handleNewOwnerCancel} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 mx-2 rounded focus:outline-none focus:shadow-outline">Cancel</button>
                </div>
            )}
        </div>
    );
});

export default OwnerList;
