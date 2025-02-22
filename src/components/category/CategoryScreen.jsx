import React, { useContext, useCallback } from 'react';
import debounce from 'lodash.debounce';
import RichInput from '../common/RichInput';
import { categoryApi } from '../../backend-adapter/BackendAdapter';
import { DBContext } from '../../store/db-context';
import { AppContext } from '../../store/app-context';
import ActionButton from '../common/ActionButton';
import AddCategory from './AddCategory';

const CategoryScreen = () => {

    const { translate: t } = useContext(AppContext);
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
                <div className='border-b border-gray-700 pb-4'>
                    <h2 className='mb-1'>{t('add new category')}</h2>
                    <AddCategory onClose={() => { }}></AddCategory>
                </div>
            </div>
            <div className='flex-1 overflow-y-auto'>
                <table className="min-w-full bg-white">
                    <thead>
                        <tr>
                            <th className="py-2 px-4 border-b"></th>
                            <th className="py-2 px-4 border-b">{t('name')}</th>
                            <th className="py-2 px-4 border-b">{t('article count')}</th>
                            <th className="py-2 px-4 border-b">{t('color')}</th>
                            <th className="py-2 px-4 border-b">{''}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allCategories.map((category, index) => (
                            <tr key={category.id}>
                                <td className='border-b text-center'>
                                    <h2>{index+1}</h2>
                                </td>
                                <td className='border-b text-center'>
                                    <RichInput initialText={category.name} handleSave={(newName) => handleNameChange(category.id, newName)}></RichInput>
                                </td>
                                <td className="py-2 px-4 border-b text-center">{category.articleCount}</td>
                                <td className="py-2 px-4 border-b text-center">
                                    <input
                                        type="color"
                                        value={category.color}
                                        onChange={(e) => handleColorChange(category.id, e.target.value)}
                                        className='cursor-pointer w-8 h-8'
                                    />
                                </td>
                                <td className="py-2 px-4 border-b text-center">
                                    {/* <button className="bg-blue-500 text-white px-2 py-1 rounded mr-2">{t('go to articles')}</button> */}
                                    {category.articleCount <= 0 && <ActionButton color='red' onClick={() => handleDeleteCategory(category.id)}>{t('delete')}</ActionButton>}
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