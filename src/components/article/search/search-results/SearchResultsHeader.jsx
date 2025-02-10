import React, { useState, useContext } from 'react';
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon, 
    ChevronUpIcon, ChevronDownIcon, ArrowsPointingOutIcon, 
    ArrowsPointingInIcon, PencilSquareIcon, BoltIcon } from '@heroicons/react/24/outline';
import { SearchContext } from '../../../../store/search-context.jsx';
import FormatButton from '../../../common/FormatButton.jsx';
import { AppContext } from '../../../../store/app-context.jsx';
import { DBContext } from '../../../../store/db-context.jsx';
import AddArticleModal from '../../modals/AddArticleModal.jsx';
import ActionButton from '../../../common/ActionButton.jsx';

const SearchResultsHeader = () => {

    const [isAddArticleModalOpen, setAddArticleModalOpen] = useState(false);
    const { filteredArticles, sidePanelCollapsed, setSidePanelCollapsed, areArticlesSelectable, toggleArticlesSelectable, selectAllOrNone } = useContext(SearchContext);
    const { fullScreen, setFullScreen, handleAddRandomTab, translate: t } = useContext(AppContext);
    const { setArticleOrder } = useContext(DBContext);

    const handleOrderByDateAsc = () => {
        setArticleOrder({ field: 'date', direction: 'asc' });
    }

    const handleOrderByDateDesc = () => {
        setArticleOrder({ field: 'date', direction: 'desc' });
    }

    return (
        <div className='flex flex-wrap justify-between px-2 py-1 shadow-lg bg-white'>
            {/* left */}
            <div className='flex flex-wrap gap-1'>
                {sidePanelCollapsed ?
                    <FormatButton onClick={() => setSidePanelCollapsed(false)}>
                        <ChevronRightIcon className="w-5 h-5" />
                    </FormatButton>
                    :
                    <FormatButton onClick={() => setSidePanelCollapsed(true)}>
                        <ChevronLeftIcon className="w-5 h-5" />
                    </FormatButton>}
                {/* <FormatButton onClick={() => toggleArticlesSelectable()}><PencilSquareIcon className="w-5 h-5"/></FormatButton> */}
                <FormatButton onClick={handleOrderByDateAsc}><ChevronUpIcon className="w-5 h-5"/></FormatButton>
                <FormatButton onClick={handleOrderByDateDesc}><ChevronDownIcon className="w-5 h-5"/></FormatButton>
            </div>
            {/* center */}
            <div>
                {areArticlesSelectable &&
                    <div className='flex flex-wrap gap-1'>
                        <ActionButton onClick={()=>selectAllOrNone(true)} color='blue'>{t('selectAll')}</ActionButton>
                        <ActionButton onClick={()=>selectAllOrNone(false)} color='blue'>{t('selectNone')}</ActionButton>
                    </div>
                }
                <h3 className='text-xl text-gray-700 py-2 flex justify-center'>{filteredArticles.length + ' ' + t('articlesTR')}</h3>
            </div>
            {/* right */}
            <div className='flex flex-wrap gap-1'>
                <FormatButton onClick={handleAddRandomTab}><BoltIcon className="w-5 h-5" /></FormatButton>
                <FormatButton onClick={() => setAddArticleModalOpen(true)}><PlusIcon className="w-5 h-5" /></FormatButton>
                {fullScreen ?
                    <FormatButton onClick={() => setFullScreen(false)}>
                        <ArrowsPointingInIcon className="w-5 h-5" />
                    </FormatButton>
                    :
                    <FormatButton onClick={() => setFullScreen(true)}>
                        <ArrowsPointingOutIcon className="w-5 h-5" />
                    </FormatButton>}
            </div>
            <AddArticleModal isOpen={isAddArticleModalOpen} onRequestClose={() => setAddArticleModalOpen(false)} />
        </div>
    );
};

export default SearchResultsHeader;
