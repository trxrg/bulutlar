import React from 'react';

import ReadHeader from './ReadHeader.jsx';
import ReadBody from './ReadBody.jsx';

const ReadMainPanel = () => {
  return (
    <div className="h-full flex flex-col mx-auto bg-stone-50">
      <div className="p-6 flex-shrink-0 border-b shadow-lg">
        <ReadHeader></ReadHeader>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ReadBody></ReadBody>
      </div>
    </div>
  );
};

export default ReadMainPanel;
