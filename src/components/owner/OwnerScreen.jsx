import React, { useContext, useState, useEffect } from 'react';
import RichInput from '../common/RichInput';
import { ownerApi } from '../../backend-adapter/BackendAdapter';
import { DBContext } from '../../store/db-context';
import { AppContext } from '../../store/app-context';
import { SearchContext } from '../../store/search-context';
import AddOwner from './AddOwner';
import ActionButton from '../common/ActionButton';

const OwnerScreen = () => {
    const { translate: t, normalizeText, setActiveScreen, setActiveTabId } = useContext(AppContext);
    const { allOwners, fetchOwnerById, fetchAllOwners } = useContext(DBContext);
    const { selectOnlyAnOwner } = useContext(SearchContext);
    
    const [filterTerm, setFilterTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

    useEffect(() => {
        fetchAllOwners();
    }, []);

    const handleNameChange = async (id, newName) => {
        await ownerApi.updateName(id, newName);
        fetchOwnerById(id);
    };

    const handleDeleteOwner = async (id) => {
        await ownerApi.deleteById(id);
        fetchAllOwners();
    };

    const filteredOwners = React.useMemo(() => {
        return allOwners.filter(owner => normalizeText(owner.name).includes(normalizeText(filterTerm)));
    }, [allOwners, filterTerm]);

    const sortedOwners = React.useMemo(() => {
        let sortableTags = [...filteredOwners];
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
    }, [filteredOwners, sortConfig]);

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

    const handleSelectOwner = (ownerName) => {
        selectOnlyAnOwner(ownerName);
        setActiveScreen('tabs');
        setActiveTabId('search');
    }

    return (
        <div className="container flex flex-col h-full mx-auto p-4 bg-white">
            <div className='flex-shrink-0 flex flex-col gap-4 mb-2 p-2'>
                <div className='border-b border-gray-700 pb-4'>
                    <h2 className='mb-1'>{t('add new owner')}</h2>
                    <AddOwner onClose={() => { }}></AddOwner>
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
                <table className="min-w-full ">
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
                        {sortedOwners.map((owner, index) => (
                            <tr key={owner.id} className="hover:bg-gray-100 group">
                                <td className='border-b text-center'>
                                    <h2>{index + 1}</h2>
                                </td>
                                <td className='border-b text-center'>
                                    <RichInput initialText={owner.name} hasEditButton={true} onClick={()=>handleSelectOwner(owner.name)} handleSave={(newName) => handleNameChange(owner.id, newName)}></RichInput>
                                </td>
                                <td className="py-2 px-4 border-b text-center">{owner.articleCount}</td>
                                <td className="py-2 px-4 border-b text-center">
                                    <div className="flex justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        {/* <button className="bg-blue-500 text-white px-2 py-1 rounded">{t('go to articles')}</button> */}
                                        {owner.articleCount <= 0 && <ActionButton color='red' onClick={() => handleDeleteOwner(owner.id)}>{t('delete')}</ActionButton>}
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

export default OwnerScreen;