import React, { useState, useContext } from 'react';
import {
    PlusIcon, ChevronLeftIcon, ChevronRightIcon,
    PencilSquareIcon, BoltIcon, DocumentArrowDownIcon, FolderPlusIcon
} from '@heroicons/react/24/outline';
import { SearchContext } from '../../../../store/search-context.jsx';
import FormatButton from '../../../common/FormatButton.jsx';
import { AppContext } from '../../../../store/app-context.jsx';
import { DBContext } from '../../../../store/db-context.jsx';
import AddArticleModal from '../../modals/AddArticleModal.jsx';
import ActionButton from '../../../common/ActionButton.jsx';
import { groupApi } from '../../../../backend-adapter/BackendAdapter.js';
import GroupModal from '../../../group/GroupModal.jsx';
import OrderBySelect from './OrderBySelect.jsx';
import toastr from 'toastr';

const SearchResultsHeader = () => {

    const [isAddArticleModalOpen, setAddArticleModalOpen] = useState(false);
    const [isGroupModalOpen, setGroupModalOpen] = useState(false);
    const { filteredArticles, sidePanelCollapsed, setSidePanelCollapsed,
        areArticlesSelectable, toggleArticlesSelectable,
        selectAllOrNone, generatePDFOfSelectedArticles, selectedArticles } = useContext(SearchContext);
    const { handleAddRandomTab, translate: t } = useContext(AppContext);
    const { articleOrder, setArticleOrder, fetchAllArticles } = useContext(DBContext);

    const handleOrderChange = (order) => {
        setArticleOrder(order);
    };

    const handleAddToGroupClick = () => {
        if (!areArticlesSelectable)
            toggleArticlesSelectable();
        else
            setGroupModalOpen(true);
    }

    const addSelectedArticlesToGroup = async (groupName) => {
        if (!selectedArticles || selectedArticles.length === 0)
            return;

        try {
            await groupApi.addArticles(groupName, selectedArticles);
            setGroupModalOpen(false);
            fetchAllArticles();
            toggleArticlesSelectable();
            toastr.success(t('articles added to group'));
        } catch (error) {
            console.error('addArticles returned an error', error);
            toastr.error(t('error adding article to group'));
        }
    }

    return (
        <div className='flex flex-col gap-2 shadow-lg bg-white p-2'>
            <div className='flex justify-between w-full'>
                {/* left */}
                <div className='flex flex-wrap gap-1'>
                    {sidePanelCollapsed ?
                        <FormatButton onClick={() => setSidePanelCollapsed(false)} title={t('show left panel')}>
                            <ChevronRightIcon className="w-5 h-5" />
                        </FormatButton>
                        :
                        <FormatButton onClick={() => setSidePanelCollapsed(true)} title={t('hide left panel')}>
                            <ChevronLeftIcon className="w-5 h-5" />
                        </FormatButton>}
                    <FormatButton onClick={() => toggleArticlesSelectable()} title={t('select articles')}><PencilSquareIcon className="w-5 h-5" /></FormatButton>
                    <FormatButton onClick={handleAddToGroupClick} title={t('add selected articles to group')}><FolderPlusIcon className="w-5 h-5" /></FormatButton>
                </div>
                {/* center */}
                <div className='flex gap-2 items-center'>
                    <h3 className='text-xl text-gray-700 flex justify-center'>{(areArticlesSelectable ? selectedArticles.length + '/' : '') + filteredArticles.length + ' ' + t('articlesTR')}</h3>
                </div>
                {/* right */}
                <div className='flex flex-wrap gap-1'>
                    <OrderBySelect onOrderChange={handleOrderChange} initialSelection={articleOrder} />
                    {/* <FormatButton onClick={generatePDFOfSelectedArticles} title={t('download as pdf')}><DocumentArrowDownIcon className="w-5 h-5" /></FormatButton> */}
                    <FormatButton onClick={handleAddRandomTab} title={t('open random article')}><BoltIcon className="w-5 h-5" /></FormatButton>
                    <FormatButton onClick={() => setAddArticleModalOpen(true)} title={t('add article')}><PlusIcon className="w-5 h-5" /></FormatButton>
                </div>
            </div>
            {areArticlesSelectable &&
                <div className='flex flex-wrap gap-1'>
                    <ActionButton onClick={() => selectAllOrNone(true)} color='blue'>{t('selectAll')}</ActionButton>
                    <ActionButton onClick={() => selectAllOrNone(false)} color='blue'>{t('selectNone')}</ActionButton>
                </div>
            }
            <AddArticleModal isOpen={isAddArticleModalOpen} onRequestClose={() => setAddArticleModalOpen(false)} />
            <GroupModal isOpen={isGroupModalOpen} onRequestClose={() => setGroupModalOpen(false)} onConfirm={addSelectedArticlesToGroup} />
        </div>
    );
};

export default SearchResultsHeader;
