import React from 'react';

import ReadHeader from './ReadHeader.jsx';
import ReadBody from './ReadBody.jsx';

const ReadScreen = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0">
        <ReadHeader />
      </div>
      <div className="flex-1">
        <ReadBody />
      </div>
    </div>
  );
};

export default ReadScreen;
