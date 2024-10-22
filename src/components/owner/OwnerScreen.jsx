import React, { useContext } from 'react';
import RichInput from '../common/RichInput';
import { ownerApi } from '../../backend-adapter/BackendAdapter';
import { DBContext } from '../../store/db-context';
import { AppContext } from '../../store/app-context';
import ActionButton from '../common/ActionButton';
import AddOwner from './AddOwner';

const OwnerScreen = () => {
    const { allOwners, fetchOwnerById, fetchAllOwners } = useContext(DBContext);
    const { translate: t } = useContext(AppContext);

    const handleNameChange = async (id, newName) => {
        await ownerApi.updateName(id, newName);
        fetchOwnerById(id);
    };

    const handleDeleteOwner = async (id) => {
        await ownerApi.deleteById(id);
        fetchAllOwners();
    }

    return (
        <div className="container flex flex-col h-full mx-auto p-4">
            <div className='flex-shrink-0'>
                <div className='mb-2 p-2 bg-white'>
                    <h2 className='mb-1'>{t('add new owner')}</h2>
                    <AddOwner onClose={() => { }}></AddOwner>
                </div>
            </div>
            <div className='flex-1 overflow-y-auto'>
                <table className="min-w-full bg-white">
                    <thead>
                        <tr>
                            <th className="py-2 px-4 border-b">{t('name')}</th>
                            <th className="py-2 px-4 border-b">{t('article count')}</th>
                            <th className="py-2 px-4 border-b"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {allOwners.map(owner => (
                            <tr key={owner.id}>
                                <td className='border-b'>
                                    <RichInput initialText={owner.name} handleSave={(newName) => handleNameChange(owner.id, newName)}></RichInput>
                                </td>
                                <td className="py-2 px-4 border-b">{owner.articleCount}</td>
                                <td className="py-2 px-4 border-b flex">
                                    <button className="bg-blue-500 text-white px-2 py-1 rounded mr-2">{t('go to articles')}</button>
                                    {owner.articleCount <= 0 && <ActionButton color='red' onClick={() => handleDeleteOwner(owner.id)}>{t('delete')}</ActionButton>}
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