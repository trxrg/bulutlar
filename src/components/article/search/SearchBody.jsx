import React, { useState, useEffect, useContext } from 'react';
import SplitPane from 'react-split-pane';

import SearchResults from './search-results/SearchResults.jsx';
import SearchControls from './filtering/SearchControls.jsx';
import { SearchContext } from '../../../store/search-context.jsx';

const SearchBody = () => {

    const [containerWidth, setContainerWidth] = useState(window.innerWidth);
    const { sidePanelCollapsed } = useContext(SearchContext);

    useEffect(() => {
        const handleResize = () => {
            setContainerWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <SplitPane
            split="vertical"
            minSize={containerWidth * 0.2}
            maxSize={containerWidth * 0.6}
            size={sidePanelCollapsed ? '0%' : containerWidth * 0.3}
            paneStyle={{ overflow: 'auto' }}
            resizerStyle={sidePanelCollapsed ? { display: 'none' } : { background: '#6b6969', cursor: 'col-resize', width: '12px' }}
        >
            <SearchControls></SearchControls>
            <SearchResults></SearchResults>
        </SplitPane>
    );
};

export default SearchBody;