import React, { useState, useContext } from 'react';

import { AppContext } from '../../store/app-context.jsx';
import { ReadContext } from '../../store/read-context';
import ReadHeader from './ReadHeader.jsx';
import ReadBody from './ReadBody.jsx';

const ReadMainPanel = () => {

  const { editClicked } = useContext(AppContext);
  const { article } = useContext(ReadContext);

  const [showCode, setShowCode] = useState(false);

  const handleEditClicked = (article) => {
    editClicked(article);
  }

  const toggleShowCode = () => {
    setShowCode(prev => !prev);
  }

  return (
    <div className="max-h-full overflow-auto mx-auto bg-stone-50">
      <div className="p-6">
        <ReadHeader handleEditClicked={handleEditClicked}></ReadHeader>
        <ReadBody></ReadBody>
      </div>
      <div className='flex'>
        <h2 className='mx-2 cursor-pointer hover:text-green-500' onClick={(toggleShowCode)}>{showCode ? 'Hide' : 'Show'} Code</h2>
        {showCode && <h2>{article.code}</h2>}
      </div>
    </div>
  );
};

export default ReadMainPanel;
