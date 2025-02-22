import React, { useContext, useState, useEffect } from 'react';
import RichInput from '../common/RichInput';
import { groupApi } from '../../backend-adapter/BackendAdapter';
import { DBContext } from '../../store/db-context';
import { AppContext } from '../../store/app-context';
import ActionButton from '../common/ActionButton';
import AddGroup from './AddGroup';

const GroupScreen = () => {
    const { translate: t, normalizeText } = useContext(AppContext);
    const { allGroups, fetchGroupById, fetchAllGroups } = useContext(DBContext);

    const [filterTerm, setFilterTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

    useEffect(() => {
        fetchAllGroups();
    }, []);

    const handleNameChange = async (id, newName) => {
        await groupApi.updateName(id, newName);
        fetchGroupById(id);
    };

    const handleDeleteGroup = async (id) => {
        await groupApi.deleteById(id);
        fetchAllGroups();
    };

    const filteredGroups = React.useMemo(() => {
        return allGroups.filter(group => normalizeText(group.name).includes(normalizeText(filterTerm)));
    }, [allGroups, filterTerm, normalizeText]);

    const sortedGroups = React.useMemo(() => {
        let sortableGroups = [...filteredGroups];
        if (sortConfig.key !== null) {
            sortableGroups.sort((a, b) => {
                if (normalizeText(a[sortConfig.key]) < normalizeText(b[sortConfig.key])) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (normalizeText(a[sortConfig.key]) > normalizeText(b[sortConfig.key])) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableGroups;
    }, [filteredGroups, sortConfig, normalizeText]);

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
                <div className='border-b border-gray-700 pb-4'>
                    <h2 className='mb-1'>{t('add new group')}</h2>
                    <AddGroup onClose={() => {}}></AddGroup>
                </div>
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
                        {sortedGroups.map((group, index) => (
                            <tr key={group.id} className="hover:bg-gray-100 group">
                                <td className='border-b text-center'>
                                    <h2>{index + 1}</h2>
                                </td>
                                <td className='border-b text-center'>
                                    <RichInput initialText={group.name} handleSave={(newName) => handleNameChange(group.id, newName)}></RichInput>
                                </td>
                                <td className="py-2 px-4 border-b text-center">{group.articleCount}</td>
                                <td className="py-2 px-4 border-b text-center">
                                    <div className="flex justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        {group.articleCount <= 0 && <ActionButton color='red' onClick={() => handleDeleteGroup(group.id)}>{t('delete')}</ActionButton>}
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

export default GroupScreen;