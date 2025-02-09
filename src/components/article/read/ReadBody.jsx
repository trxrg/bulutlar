import React, { useState, useEffect, useContext } from 'react';
import SplitPane from 'react-split-pane';
import ReadLeftPanel from './ReadLeftPanel';
import { ReadContext } from '../../../store/read-context';
import BodyWithFixedHeader from '../../common/BodyWithFixedHeader';
import ReadControls from './ReadControls';
import ReadContent from './ReadContent';
import ReadRightPanel from './right-panel/ReadRightPanel';

const ReadBody = () => {

  const { leftPanelCollapsed, rightPanelCollapsed } = useContext(ReadContext);

  const [containerWidth, setContainerWidth] = useState(window.innerWidth);

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
    <div className='h-full relative'>
      <SplitPane
        split="vertical"
        minSize={containerWidth * 0.6}
        maxSize={containerWidth * 0.8}
        size={rightPanelCollapsed ? '100%' : containerWidth * 0.8}
        resizerStyle={rightPanelCollapsed ? { display: 'none' } : { background: '#809671', cursor: 'col-resize', width: '4px' }}
      >
        <SplitPane
          split="vertical"
          minSize={containerWidth * 0.1}
          maxSize={containerWidth * 0.3}
          size={leftPanelCollapsed ? '0%' : containerWidth * 0.2}
          resizerStyle={leftPanelCollapsed ? { display: 'none' } : { background: '#809671', cursor: 'col-resize', width: '4px' }}
        >
          <div className={`h-full transition-transform duration-300 ${leftPanelCollapsed ? 'transform -translate-x-full w-0 opacity-0' : 'w-full'}`}>
            <ReadLeftPanel />
          </div>
          <div className='h-full'>
            <BodyWithFixedHeader >
              <ReadControls />
              <ReadContent />
            </BodyWithFixedHeader>
          </div>
        </SplitPane>
        <div className={`h-full transition-transform duration-300 ${rightPanelCollapsed ? 'transform translate-x-full w-0 opacity-0' : 'w-full'}`}>
          <ReadRightPanel />
        </div>
      </SplitPane>
    </div>
  );
};

export default ReadBody;
