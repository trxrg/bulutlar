import React, { useState, useContext } from "react";
import { AppContext } from "../../store/app-context";
import ActionButton from "../../components/ActionButton";
import CategoryModal from "./CategoryModal";

const CategoryList = ({ showNewButton, onCategoryChange }) => {

    const [isModalOpen, setIsModalOpen] = useState(false);
    const { allCategories } = useContext(AppContext);

    const handleSelectChange = (event) => {
        event.preventDefault();
        onCategoryChange(event.target.value);
    };

    const handleNewClicked = (event) => {
        event.preventDefault();
        setIsModalOpen(true);
    }

    return (
        <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2" htmlFor="category">Category:</label>
            <div className="flex gap-2">
                <select
                    id="category"
                    onChange={handleSelectChange}
                    required
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                    <option value="">Select Category</option>
                    {allCategories.map((category) => (
                        <option key={category.id} value={category.name}>
                            {category.name}
                        </option>
                    ))}
                </select>
                {showNewButton && <ActionButton color="blue" onClick={handleNewClicked}>New</ActionButton>}
            </div>

            <CategoryModal isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)}>
            </CategoryModal>
        </div>
    );
};

export default CategoryList;
