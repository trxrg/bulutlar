import React, { useEffect, useContext, useRef } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';

import SearchResults from './search-results/SearchResults.jsx';
import SearchFilterings from './filtering/SearchFilterings.jsx';
import { SearchContext } from '../../../store/search-context.jsx';

const resizerStyle = { width: '4px', background: 'var(--border-primary)', cursor: 'col-resize', outline: 'none' };
const panelContentStyle = { height: '100%', overflow: 'hidden' };

const SearchBody = () => {

    const { sidePanelCollapsed } = useContext(SearchContext);
    const sidePanelRef = useRef(null);

    useEffect(() => {
        if (sidePanelCollapsed) sidePanelRef.current?.collapse();
        else sidePanelRef.current?.expand();
    }, [sidePanelCollapsed]);

    return (
        <div className='h-full'>
            <Group className='h-full'>

                <Panel panelRef={sidePanelRef} defaultSize="30" minSize="20" maxSize="60" collapsible style={panelContentStyle}>
                    <SearchFilterings />
                </Panel>

                <Separator style={sidePanelCollapsed ? { display: 'none' } : resizerStyle} />

                <Panel defaultSize="70" minSize="40" style={panelContentStyle}>
                    <SearchResults />
                </Panel>

            </Group>
        </div>
    );
};

export default SearchBody;
