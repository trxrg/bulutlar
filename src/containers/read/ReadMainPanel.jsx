import React, { useState, useContext } from 'react';

import { ReadContext } from '../../store/read-context';
import ReadHeader from './ReadHeader.jsx';
import ReadBody from './ReadBody.jsx';

const ReadMainPanel = () => {

  const { article } = useContext(ReadContext);

  const [showCode, setShowCode] = useState(false);


  const toggleShowCode = () => {
    setShowCode(prev => !prev);
  }

  return (
    <div className="h-full mx-auto bg-stone-50">
      <div className="p-6 h-[25%] border-b shadow-lg">
        <ReadHeader></ReadHeader>
      </div>
      <div className="h-[70%]">
        <ReadBody></ReadBody>
      </div>
      <div className='flex h-[5%]'>
        <h2 className='mx-2 cursor-pointer hover:text-green-500' onClick={(toggleShowCode)}>{showCode ? 'Hide' : 'Show'} Code</h2>
        {showCode && <h2>{article.code}</h2>}
      </div>
    </div>
  );
};

export default ReadMainPanel;
