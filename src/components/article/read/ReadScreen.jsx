import React, { useState, useRef, useContext, useCallback, useEffect } from 'react';

import ReadHeader from './ReadHeader.jsx';
import ReadBody from './ReadBody.jsx';
import { AppContext } from '../../../store/app-context.jsx';
import { ReadContext } from '../../../store/read-context.jsx';

const ReadScreen = () => {
  const { autoHideControls } = useContext(AppContext);
  const { editable, setHeaderCompact } = useContext(ReadContext);

  const [controlsTrigger, setControlsTrigger] = useState(false);
  const triggerTimeoutRef = useRef(null);
  const controlsPinnedRef = useRef(false);

  const isAutoHiding = autoHideControls && !editable;

  useEffect(() => {
    return () => clearTimeout(triggerTimeoutRef.current);
  }, []);

  useEffect(() => {
    if (isAutoHiding && !controlsPinnedRef.current) {
      setControlsTrigger(false);
    }
  }, [isAutoHiding]);

  const showControls = useCallback(() => {
    if (!isAutoHiding) return;
    clearTimeout(triggerTimeoutRef.current);
    setControlsTrigger(true);
  }, [isAutoHiding]);

  const hideControls = useCallback(() => {
    if (!isAutoHiding) return;
    if (controlsPinnedRef.current) return;
    triggerTimeoutRef.current = setTimeout(() => {
      if (controlsPinnedRef.current) return;
      setControlsTrigger(false);
    }, 300);
  }, [isAutoHiding]);

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex-shrink-0"
        onMouseEnter={() => { showControls(); setHeaderCompact(false); }}
        onMouseLeave={hideControls}
      >
        <ReadHeader />
      </div>
      <div className="flex-1 overflow-hidden">
        <ReadBody
          controlsTrigger={controlsTrigger}
          showControls={showControls}
          hideControls={hideControls}
          controlsPinnedRef={controlsPinnedRef}
        />
      </div>
    </div>
  );
};

export default ReadScreen;
