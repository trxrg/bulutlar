import React, { useContext, useCallback } from 'react';
import debounce from 'lodash.debounce';
import RichInput from '../common/RichInput';
import { categoryApi } from '../../backend-adapter/BackendAdapter';
import { DBContext } from '../../store/db-context';
import { AppContext } from '../../store/app-context';
import ActionButton from '../common/ActionButton';
import AddCategory from './AddCategory';
import { SearchContext } from '../../store/search-context';

const CategoryScreen = () => {

    const { translate: t, setActiveScreen, setActiveTabId } = useContext(AppContext);
    const { allCategories, fetchCategoryById, fetchAllCategories } = useContext(DBContext);
    const { selectOnlyACategory } = useContext(SearchContext);

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

    const handleSelectCategory = (categoryName) => {
        selectOnlyACategory(categoryName);
        setActiveScreen('tabs');
        setActiveTabId('search');
    }

    return (
        <div className="container flex flex-col h-full mx-auto p-4" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            <div className='flex-shrink-0'>
                <div className='border-b pb-4' style={{ borderColor: 'var(--border-secondary)' }}>
                    <h2 className='mb-1' style={{ color: 'var(--text-primary)' }}>{t('add new category')}</h2>
                    <AddCategory onClose={() => { }}></AddCategory>
                </div>
            </div>
            <div className='flex-1 overflow-y-auto'>
                <table className="min-w-full" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <thead>
                        <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                            <th className="py-2 px-4 border-b" style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-primary)' }}></th>
                            <th className="py-2 px-4 border-b" style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-primary)' }}>{t('name')}</th>
                            <th className="py-2 px-4 border-b" style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-primary)' }}>{t('article count')}</th>
                            <th className="py-2 px-4 border-b" style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-primary)' }}>{t('color')}</th>
                            <th className="py-2 px-4 border-b" style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-primary)' }}>{''}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allCategories.map((category, index) => (
                            <tr key={category.id} style={{ backgroundColor: 'var(--bg-primary)' }}>
                                <td className='border-b text-center' style={{ borderColor: 'var(--border-secondary)' }}>
                                    <h2 style={{ color: 'var(--text-primary)' }}>{index+1}</h2>
                                </td>
                                <td className='border-b text-center' style={{ borderColor: 'var(--border-secondary)' }}>
                                    <RichInput initialText={category.name} hasEditButton={true} onClick={()=>handleSelectCategory(category.name)} handleSave={(newName) => handleNameChange(category.id, newName)}></RichInput>
                                </td>
                                <td className="py-2 px-4 border-b text-center" style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-primary)' }}>{category.articleCount}</td>
                                <td className="py-2 px-4 border-b text-center" style={{ borderColor: 'var(--border-secondary)' }}>
                                    <input
                                        type="color"
                                        value={category.color}
                                        onChange={(e) => handleColorChange(category.id, e.target.value)}
                                        className='cursor-pointer w-8 h-8 rounded-full'
                                        style={{ backgroundColor: 'var(--bg-primary)' }}
                                    />
                                </td>
                                <td className="py-2 px-4 border-b text-center" style={{ borderColor: 'var(--border-secondary)' }}>
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