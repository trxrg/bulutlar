import React from 'react';

import ReadHeader from './ReadHeader.jsx';
import ReadBody from './ReadBody.jsx';

const ReadScreen = () => {
  return (
    <div className="flex flex-col h-full mx-auto bg-stone-50">
      <div className="p-6 flex-shrink-0 border-b shadow-lg">
        <ReadHeader />
      </div>
      <div className="flex-1">
        <ReadBody />
      </div>
    </div>
  );
};

export default ReadScreen;
