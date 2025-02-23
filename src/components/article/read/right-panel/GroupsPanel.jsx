import React, { useContext, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import BodyWithFixedHeader from '../../../common/BodyWithFixedHeader';
import FormatButton from '../../../common/FormatButton';
import { AppContext } from '../../../../store/app-context';
import { ReadContext } from '../../../../store/read-context';
import { DBContext } from '../../../../store/db-context';
import { articleApi } from '../../../../backend-adapter/BackendAdapter';
import GroupCard from './GroupCard';
import GroupModal from '../../../group/GroupModal';

const GroupsPanel = () => {
    const { translate: t, setActiveScreen } = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { article } = useContext(ReadContext);
    const { fetchArticleById, fetchAllGroups } = useContext(DBContext);

    const handleTitleClick = () => {
        setActiveScreen('groups');
    }

    const addArticleToGroup = async (groupName) => {
        await articleApi.addToGroup(article.id, groupName);
        fetchArticleById(article.id);
        fetchAllGroups();
    }

    return (
        <div className='border-t-4 border-[#809671] h-full'>
            <BodyWithFixedHeader>
                <div className='flex flex-wrap justify-between p-2 shadow-lg bg-white'>
                    <h2 className='ml-2 text-xl font-semibold text-gray-800 cursor-pointer hover:underline' onClick={handleTitleClick}>{t('groups')}</h2>
                    <FormatButton onClick={() => setIsModalOpen(true)} title={t('add to group')}><PlusIcon className="w-5 h-5" /></FormatButton>
                </div>
                {article.groups.length > 0 ?
                    <div className='flex flex-col gap-2 p-2'>
                        {article.groups.map((group) => <GroupCard key={group.id} groupId={group.id} />)}
                    </div>
                    :
                    <div className='flex justify-center p-2 h-full'>
                        <p>{t('no groups')}</p>
                    </div>}
            </BodyWithFixedHeader>
            <GroupModal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)} onConfirm={addArticleToGroup}/>
        </div>
    );
};

export default GroupsPanel;