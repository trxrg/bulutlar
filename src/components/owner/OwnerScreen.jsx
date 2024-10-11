import React, { useContext } from 'react';
import RichInput from '../common/RichInput';
import { ownerApi } from '../../backend-adapter/BackendAdapter';
import { DBContext } from '../../store/db-context';
import ActionButton from '../common/ActionButton';
import AddOwner from './AddOwner';

const OwnerScreen = () => {
    const { allOwners, fetchOwnerById, fetchAllOwners } = useContext(DBContext);

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
                <h1 className="text-2xl font-bold mb-4">Owners</h1>
                <div className='mb-2 p-2 bg-white'>
                    <h2>Add new owner</h2>
                    <AddOwner onClose={() => { }}></AddOwner>
                </div>
            </div>
            <div className='flex-1 overflow-y-auto'>
                <table className="min-w-full bg-white">
                    <thead>
                        <tr>
                            <th className="py-2 px-4 border-b">Name</th>
                            <th className="py-2 px-4 border-b">Article Count</th>
                            <th className="py-2 px-4 border-b">Actions</th>
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
                                    <button className="bg-blue-500 text-white px-2 py-1 rounded mr-2">Go to Articles</button>
                                    {owner.articleCount <= 0 && <ActionButton color='red' onClick={() => handleDeleteOwner(owner.id)}>Delete</ActionButton>}
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