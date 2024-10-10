import React, { useContext } from 'react';
import SplitPane from 'react-split-pane';
import ReadMainPanel from './ReadMainPanel';
import ReadSidePanel from './ReadSidePanel';
import { ReadContext } from '../../store/read-context';

const ReadScreen = () => {

  const { sidePanelCollapsed } = useContext(ReadContext);

  return (
    <SplitPane
      split="vertical"
      minSize={1000}
      maxSize={1200}
      size={sidePanelCollapsed ? '100%' : '77%'}
      style={{
        position: 'absolute',
        left: 0,
        overflow: 'hidden',
        height: '100%',
        transition: 'all 0.3s ease'
      }}
      paneStyle={{}}
      resizerStyle={{ background: '#6b6969', cursor: 'col-resize', width: '12px' }}
    >
      <SplitPane
        split="vertical"
        minSize={200}
        maxSize={400}
        size={'30%'}
        style={{
          position: 'absolute',
          left: 0,
          overflow: 'hidden',
          height: '100%',
          transition: 'all 0.3s ease'
        }}
        paneStyle={{}}
        resizerStyle={{ background: '#6b6969', cursor: 'col-resize', width: '12px' }}
      >
        <div className={`bg-gray-200 transition-transform duration-300 ${sidePanelCollapsed ? 'transform translate-x-full w-0' : 'w-full'}`}>
          <ReadSidePanel />
        </div>
        <div className='h-full'>
          <ReadMainPanel />
        </div>
      </SplitPane>
      <div className={`bg-gray-200 transition-transform duration-300 ${sidePanelCollapsed ? 'transform translate-x-full w-0' : 'w-full'}`}>
        <ReadSidePanel />
      </div>
    </SplitPane>
  );
};

export default ReadScreen;
