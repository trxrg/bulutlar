import React, { useState, useEffect, useContext } from 'react';
import SplitPane from 'react-split-pane';
import ReadSidePanel from './ReadSidePanel';
import { ReadContext } from '../../../store/read-context';
import ReadBodyMain from './ReadBodyMain';

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
        size={rightPanelCollapsed ? '100%' : '80%'}
        style={{
          position: 'absolute',
          left: 0,
          overflow: 'hidden',
          height: '100%',
          transition: 'all 0.3s ease'
        }}
        paneStyle={{}}
        resizerStyle={rightPanelCollapsed ? { display: 'none' } : { background: '#6b6969', cursor: 'col-resize', width: '12px' }}
      >
        <SplitPane
          split="vertical"
          minSize={containerWidth * 0.1}
          maxSize={containerWidth * 0.3}
          size={leftPanelCollapsed ? '0%' : '30%'}
          style={{
            position: 'absolute',
            left: 0,
            overflow: 'hidden',
            height: '100%',
            transition: 'all 0.3s ease'
          }}
          paneStyle={{  }}
          resizerStyle={leftPanelCollapsed ? { display: 'none' } : { background: '#6b6969', cursor: 'col-resize', width: '12px' }}
        >
          <div className={`h-full bg-gray-200 transition-transform duration-300 ${leftPanelCollapsed ? 'transform -translate-x-full w-0' : 'w-full'}`}>
            {/* <ReadSidePanel /> */}
          </div>
          <div className='h-full'>
            <ReadBodyMain />
          </div>
        </SplitPane>
        <div className={`h-full bg-gray-200 transition-transform duration-300 ${rightPanelCollapsed ? 'transform translate-x-full w-0' : 'w-full'}`}>
          {/* <ReadSidePanel /> */}
        </div>
      </SplitPane>
    </div>
  );
};

export default ReadBody;