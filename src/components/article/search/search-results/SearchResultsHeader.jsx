import React, { useContext } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';
import { SearchContext } from '../../../../store/search-context.jsx';
import FormatButton from '../../../common/FormatButton.jsx';
import { AppContext } from '../../../../store/app-context.jsx';

const SearchResultsHeader = () => {

    const { filteredArticles, sidePanelCollapsed, setSidePanelCollapsed } = useContext(SearchContext);
    const { fullScreen, setFullScreen } = useContext(AppContext);

    return (
        <div className='flex justify-between px-2 py-1'>
            <div>
                {sidePanelCollapsed ?
                    <FormatButton onClick={() => setSidePanelCollapsed(false)}>
                        <ChevronRightIcon className="w-4 h-4" />
                    </FormatButton>
                    :
                    <FormatButton onClick={() => setSidePanelCollapsed(true)}>
                        <ChevronLeftIcon className="w-4 h-4" />
                    </FormatButton>}
            </div>
            <div>
                <h3 className='text-xl text-gray-700 py-2 flex justify-center'>{filteredArticles.length + ' articles'}</h3>
            </div>
            <div>
                {fullScreen ?
                    <FormatButton onClick={() => setFullScreen(false)}>
                        <ArrowsPointingInIcon className="w-4 h-4" />
                    </FormatButton>
                    :
                    <FormatButton onClick={() => setFullScreen(true)}>
                        <ArrowsPointingOutIcon className="w-4 h-4" />
                    </FormatButton>}
            </div>
        </div>
    );
};

export default SearchResultsHeader;