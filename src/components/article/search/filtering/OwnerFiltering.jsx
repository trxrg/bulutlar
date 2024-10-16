import React, { useContext } from 'react';
import { DBContext } from '../../../../store/db-context';
import { SearchContext } from '../../../../store/search-context';

const OwnerFiltering = () => {

    const { allOwners } = useContext(DBContext);
    const { selectedOwnerNames, setSelectedOwnerNames } = useContext(SearchContext);

    const ownerNames = allOwners.map(owner=>owner.name);

    const handleOwnerChange = (event) => {
        const { value, checked } = event.target;
        if (checked)
            setSelectedOwnerNames(prevSelectedOwnerNames => [...prevSelectedOwnerNames, value]);
        else
            setSelectedOwnerNames(prevSelectedOwnerNames => prevSelectedOwnerNames.filter((ownerName) => ownerName !== value));
    };  

    return (
        <div>
            <label className="mr-2">Owner:</label>
            <div className="overflow-auto max-h-40 border border-green-200">
                {ownerNames.map((ownerName) => (
                    <div key={ownerName} className="mb-2">
                        <label className="inline-flex items-center">
                            <input
                                type="checkbox"
                                value={ownerName}
                                checked={selectedOwnerNames.includes(ownerName)}
                                onChange={handleOwnerChange}
                                className="mr-1"
                            />
                            <span
                                className={selectedOwnerNames.includes(ownerName) ? "bg-blue-200 rounded px-2 py-1" : ""}
                            >{ownerName}</span>
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OwnerFiltering;