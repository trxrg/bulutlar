import React, { useContext } from 'react';
import RichInput from '../common/RichInput';
import { tagApi } from '../../backend-adapter/BackendAdapter';
import { DBContext } from '../../store/db-context';
import { AppContext } from '../../store/app-context';
import ActionButton from '../common/ActionButton';

const TagScreen = () => {

    const { translate: t } = useContext(AppContext);
    const { allTags, fetchTagById, fetchAllTags } = useContext(DBContext);

    const handleNameChange = async (id, newName) => {
        await tagApi.updateName(id, newName);
        fetchTagById(id);
    };

    const handleDeleteTag = async (id) => {
        await tagApi.deleteById(id);
        fetchAllTags();
    }

    return (
        <div className="container h-full overflow-y-auto mx-auto p-4">
            <table className="min-w-full bg-white">
                <thead>
                    <tr>
                        <th className="py-2 px-4 border-b"></th>
                        <th className="py-2 px-4 border-b">{t('name')}</th>
                        <th className="py-2 px-4 border-b">{t('article count')}</th>
                        <th className="py-2 px-4 border-b">{''}</th>
                    </tr>
                </thead>
                <tbody>
                    {allTags.map((tag, index) => (
                        <tr key={tag.id}>
                            <td className='border-b text-center'>
                                <h2>{index + 1}</h2>
                            </td>
                            <td className='border-b text-center'>
                                <RichInput initialText={tag.name} handleSave={(newName) => handleNameChange(tag.id, newName)}></RichInput>
                            </td>
                            <td className="py-2 px-4 border-b text-center">{tag.articleCount}</td>
                            <td className="py-2 px-4 border-b text-center">
                                <button className="bg-blue-500 text-white px-2 py-1 rounded mr-2">{t('go to articles')}</button>
                                {tag.articleCount <= 0 && <ActionButton color='red' onClick={() => handleDeleteTag(tag.id)}>{t('delete')}</ActionButton>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TagScreen;