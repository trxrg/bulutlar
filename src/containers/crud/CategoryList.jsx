import React, { useState, useContext } from "react";
import { AppContext } from "../../store/app-context";
import ActionButton from "../../components/ActionButton";
import GeneralModal from "../../components/GeneralModal";
import AddCategory from "./AddCategory";

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
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
                >
                    <option value="">Select Category</option>
                    {allCategories.map((category) => (
                        <option key={category.id} value={category.name} style={{ backgroundColor: category.color }}>
                            {category.name}
                        </option>
                    ))}
                </select>
                {showNewButton && <ActionButton color="blue" onClick={handleNewClicked}>New</ActionButton>}
            </div>

            <GeneralModal isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)}>
                <AddCategory onClose={()=>setIsModalOpen(false)}></AddCategory>
            </GeneralModal>
        </div>
    );
};

export default CategoryList;
