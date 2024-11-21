import React, { useState, useContext } from 'react';
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { SearchContext } from '../../../../store/search-context.jsx';
import FormatButton from '../../../common/FormatButton.jsx';
import { AppContext } from '../../../../store/app-context.jsx';
import AddArticleModal from '../../AddArticleModal.jsx';

const SearchResultsHeader = () => {

    const [isAddArticleModalOpen, setAddArticleModalOpen] = useState(false);
    const { filteredArticles, sidePanelCollapsed, setSidePanelCollapsed, isArticlesSelectable, toggleArticlesSelectable } = useContext(SearchContext);
    const { fullScreen, setFullScreen, translate: t } = useContext(AppContext);

    return (
        <div className='flex flex-wrap justify-between px-2 py-1 shadow-lg bg-stone-50'>
            {/* left */}
            <div className='flex flex-wrap gap-1'>
                {sidePanelCollapsed ?
                    <FormatButton onClick={() => setSidePanelCollapsed(false)}>
                        <ChevronRightIcon className="w-4 h-4" />
                    </FormatButton>
                    :
                    <FormatButton onClick={() => setSidePanelCollapsed(true)}>
                        <ChevronLeftIcon className="w-4 h-4" />
                    </FormatButton>}
                <FormatButton onClick={() => toggleArticlesSelectable()}><PencilSquareIcon className='w-4 h-4'/></FormatButton>
            </div>
            {/* center */}
            <div>
                <h3 className='text-xl text-gray-700 py-2 flex justify-center'>{filteredArticles.length + ' ' + t('articlesTR')}</h3>
            </div>
            {/* right */}
            <div className='flex flex-wrap gap-1'>
                <FormatButton onClick={() => setAddArticleModalOpen(true)}><PlusIcon className="w-4 h-4" /></FormatButton>
                {fullScreen ?
                    <FormatButton onClick={() => setFullScreen(false)}>
                        <ArrowsPointingInIcon className="w-4 h-4" />
                    </FormatButton>
                    :
                    <FormatButton onClick={() => setFullScreen(true)}>
                        <ArrowsPointingOutIcon className="w-4 h-4" />
                    </FormatButton>}
            </div>
            <AddArticleModal isOpen={isAddArticleModalOpen} onRequestClose={() => setAddArticleModalOpen(false)} />
        </div>
    );
};

export default SearchResultsHeader;
