import React, { useContext, useState, useEffect } from 'react';
import RichInput from '../common/RichInput';
import { tagApi } from '../../backend-adapter/BackendAdapter';
import { DBContext } from '../../store/db-context';
import { AppContext } from '../../store/app-context';
import ActionButton from '../common/ActionButton';

const TagScreen = () => {
    const { translate: t, normalizeText } = useContext(AppContext);
    const { allTags, fetchTagById, fetchAllTags } = useContext(DBContext);

    const [filterTerm, setFilterTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

    useEffect(() => {
        fetchAllTags();
    }, []);

    const handleNameChange = async (id, newName) => {
        await tagApi.updateName(id, newName);
        fetchTagById(id);
    };

    const handleDeleteTag = async (id) => {
        await tagApi.deleteById(id);
        fetchAllTags();
    };

    const filteredTags = React.useMemo(() => {
        return allTags.filter(tag => normalizeText(tag.name).includes(normalizeText(filterTerm)));
    }, [allTags, filterTerm]);

    const sortedTags = React.useMemo(() => {
        let sortableTags = [...filteredTags];
        if (sortConfig.key !== null) {
            sortableTags.sort((a, b) => {
                if (normalizeText(a[sortConfig.key]) < normalizeText(b[sortConfig.key])) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (normalizeText(a[sortConfig.key]) > normalizeText(b[sortConfig.key])) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableTags;
    }, [filteredTags, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
        }
        return '';
    };

    return (
        <div className="container flex flex-col h-full mx-auto p-4 bg-white">
            <div className='flex-shrink-0 flex flex-col gap-4 mb-2 p-2'>
                <div>
                    <input
                        type="text"
                        placeholder={t('filter by name')}
                        value={filterTerm}
                        onChange={(e) => setFilterTerm(e.target.value)}
                        className="border p-2 rounded w-full"
                    />
                </div>
            </div>
            <div className='flex-1 overflow-y-auto'>
                <table className="min-w-full">
                    <thead>
                        <tr>
                            <th className="py-2 px-4 border-b"></th>
                            <th className="py-2 px-4 border-b cursor-pointer select-none hover:underline" onClick={() => requestSort('name')}>
                                {t('name')}
                                <span className="inline-block w-4">{getSortIndicator('name')}</span>
                            </th>
                            <th className="py-2 px-4 border-b cursor-pointer select-none hover:underline" onClick={() => requestSort('articleCount')}>
                                {t('article count')}
                                <span className="inline-block w-4">{getSortIndicator('articleCount')}</span>
                            </th>
                            <th className="py-2 px-4 border-b"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedTags.map((tag, index) => (
                            <tr key={tag.id} className="hover:bg-gray-100 group">
                                <td className='border-b text-center'>
                                    <h2>{index + 1}</h2>
                                </td>
                                <td className='border-b text-center'>
                                    <RichInput initialText={tag.name} handleSave={(newName) => handleNameChange(tag.id, newName)}></RichInput>
                                </td>
                                <td className="py-2 px-4 border-b text-center">{tag.articleCount}</td>
                                <td className="py-2 px-4 border-b text-center">
                                    <div className="flex justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        {/* <button className="bg-blue-500 text-white px-2 py-1 rounded">{t('go to articles')}</button> */}
                                        {tag.articleCount <= 0 && <ActionButton color='red' onClick={() => handleDeleteTag(tag.id)}>{t('delete')}</ActionButton>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TagScreen;