import React, { useContext, useCallback } from 'react';
import debounce from 'lodash.debounce';
import RichInput from '../common/RichInput';
import { categoryApi } from '../../backend-adapter/BackendAdapter';
import { DBContext } from '../../store/db-context';
import ActionButton from '../common/ActionButton';
import AddCategory from './AddCategory';

const CategoryScreen = () => {

    const { allCategories, fetchCategoryById, fetchAllCategories } = useContext(DBContext);

    const handleColorChange = useCallback(
        debounce(async (id, newColor) => {
            await categoryApi.updateColor(id, newColor);
            fetchCategoryById(id);
        }, 1000), // Adjust the debounce delay as needed
        []
    );

    const handleNameChange = async (id, newName) => {
        await categoryApi.updateName(id, newName);
        fetchCategoryById(id);
    };

    const handleDeleteCategory = async (id) => {
        await categoryApi.deleteById(id);
        fetchAllCategories();
    }

    return (
        <div className="container flex flex-col h-full mx-auto p-4">
            <div className='flex-shrink-0'>
                <div className='mb-2 p-2 bg-white'>
                    <h2>Add new category</h2>
                    <AddCategory onClose={() => { }}></AddCategory>
                </div>
            </div>
            <div className='flex-1 overflow-y-auto'>
                <table className="min-w-full bg-white">
                    <thead>
                        <tr>
                            <th className="py-2 px-4 border-b">Name</th>
                            <th className="py-2 px-4 border-b">Article Count</th>
                            <th className="py-2 px-4 border-b">Color</th>
                            <th className="py-2 px-4 border-b">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allCategories.map(category => (
                            <tr key={category.id}>
                                <td className='border-b'>
                                    <RichInput initialText={category.name} handleSave={(newName) => handleNameChange(category.id, newName)}></RichInput>
                                </td>
                                <td className="py-2 px-4 border-b">{category.articleCount}</td>
                                <td className="py-2 px-4 border-b">
                                    <input
                                        type="color"
                                        value={category.color}
                                        onChange={(e) => handleColorChange(category.id, e.target.value)}
                                        className='cursor-pointer'
                                    />
                                </td>
                                <td className="py-2 px-4 border-b flex">
                                    <button className="bg-blue-500 text-white px-2 py-1 rounded mr-2">Go to Articles</button>
                                    {category.articleCount <= 0 && <ActionButton color='red' onClick={() => handleDeleteCategory(category.id)}>Delete</ActionButton>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CategoryScreen;