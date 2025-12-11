import React, { useState, useEffect, useContext, useRef } from 'react';
import SplitPane from 'react-split-pane';
import ReadLeftPanel from './ReadLeftPanel';
import { ReadContext } from '../../../store/read-context';
import { AppContext } from '../../../store/app-context';
import BodyWithFixedHeader from '../../common/BodyWithFixedHeader';
import ReadControls from './ReadControls';
import ReadContent from './ReadContent';
import ReadRightPanel from './right-panel/ReadRightPanel';
import { ArrowsPointingInIcon } from '@heroicons/react/24/outline';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { articleApi } from '../../../backend-adapter/BackendAdapter.js';
import { DBContext } from '../../../store/db-context';

const ReadBody = () => {

  const { leftPanelCollapsed, rightPanelCollapsed, article, getOwnerName, getCategoryName, beforeFullScreenToggleRef } = useContext(ReadContext);
  const { fullScreen, setFullScreen, translate: t } = useContext(AppContext);
  const { fetchArticleById } = useContext(DBContext);

  const [containerWidth, setContainerWidth] = useState(window.innerWidth);
  const [headerVisible, setHeaderVisible] = useState(false);
  
  // Refs for scroll containers
  const fullscreenScrollRef = useRef(null);
  const normalScrollRef = useRef(null);
  
  // Store scroll position info when switching modes
  const scrollPositionRef = useRef({ scrollRatio: 0 });

  // Function to capture scroll position (simple ratio-based)
  const captureScrollPosition = () => {
    const container = fullScreen ? fullscreenScrollRef.current : normalScrollRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const maxScroll = scrollHeight - clientHeight;
    scrollPositionRef.current = {
      scrollRatio: maxScroll > 0 ? scrollTop / maxScroll : 0
    };
  };

  // Set the callback in context so ReadControls can call it
  useEffect(() => {
    beforeFullScreenToggleRef.current = captureScrollPosition;
    return () => {
      beforeFullScreenToggleRef.current = null;
    };
  }, [fullScreen]);

  // Wrapper to capture scroll before toggling fullscreen
  const toggleFullScreen = (newFullScreen) => {
    captureScrollPosition();
    setFullScreen(newFullScreen);
  };

  useEffect(() => {
    const handleResize = () => {
      setContainerWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && fullScreen) {
        toggleFullScreen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [fullScreen]);

  // Restore scroll position after fullscreen change
  useEffect(() => {
    const container = fullScreen ? fullscreenScrollRef.current : normalScrollRef.current;
    const { scrollRatio } = scrollPositionRef.current;
    
    if (!container || scrollRatio === 0) return;

    // Restore scroll position using ratio
    const restoreScroll = () => {
      const { scrollHeight, clientHeight } = container;
      const maxScroll = scrollHeight - clientHeight;
      container.scrollTop = scrollRatio * maxScroll;
    };

    // Initial restore
    restoreScroll();

    // Keep adjusting as images load (content size changes)
    const observer = new ResizeObserver(restoreScroll);
    observer.observe(container);

    // Stop observing after 2 seconds (images should be loaded by then)
    const timeoutId = setTimeout(() => observer.disconnect(), 2000);

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [fullScreen]);

  // Handle mouse move for hover header
  const handleMouseMove = (e) => {
    if (fullScreen) {
      // Show header when mouse is in the top 60px
      setHeaderVisible(e.clientY < 60);
    }
  };

  const handleStarClick = async (e) => {
    e.stopPropagation();
    await articleApi.setIsStarred(article.id, !article.isStarred);
    fetchArticleById(article.id);
  };

  // Main layout - ALWAYS render the same structure, use CSS to transform for fullscreen
  // This ensures ReadContent is never unmounted when toggling fullscreen
  return (
    <div className='h-full relative'>
      {/* Fullscreen overlay elements - only shown when fullscreen */}
      {fullScreen && (
        <>
          {/* Hover Header */}
          <div 
            className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-300 ease-in-out ${
              headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'
            }`}
            style={{ 
              backgroundColor: 'var(--bg-secondary)',
              boxShadow: '0 4px 6px -1px var(--shadow)',
            }}
            onMouseEnter={() => setHeaderVisible(true)}
            onMouseLeave={(e) => {
              if (e.clientY > 60) {
                setHeaderVisible(false);
              }
            }}
          >
            <div className='flex items-center justify-between px-4 py-3'>
              <div className='flex items-center gap-4'>
                <div onClick={handleStarClick} className='flex items-center cursor-pointer'>
                  {article.isStarred ? (
                    <StarIcon style={{ fontSize: '1.5rem', color: '#FFD700' }} className="hover:scale-125" />
                  ) : (
                    <StarBorderIcon style={{ fontSize: '1.5rem', color: '#B0B0B0' }} className="hover:scale-125" />
                  )}
                </div>
                <div className='flex flex-col'>
                  <h2 className='text-lg font-semibold' style={{ color: 'var(--text-primary)' }}>
                    {article.title}
                  </h2>
                  <div className='flex gap-3 text-sm' style={{ color: 'var(--text-secondary)' }}>
                    {!article.isDateUncertain && (
                      <span>{new Date(article.date).toLocaleDateString('tr')}</span>
                    )}
                    {getOwnerName() && <span>• {getOwnerName()}</span>}
                    {getCategoryName() && <span>• {getCategoryName()}</span>}
                  </div>
                </div>
              </div>
              <button
                onClick={() => toggleFullScreen(false)}
                className='flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-opacity-80'
                style={{ 
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-secondary)'
                }}
                title={t('exit full screen') + ' (ESC)'}
              >
                <ArrowsPointingInIcon className="w-5 h-5" />
                <span className='text-sm'>{t('exit full screen')}</span>
              </button>
            </div>
          </div>

          {/* Floating exit button */}
          <button
            onClick={() => toggleFullScreen(false)}
            className='fixed bottom-6 right-6 z-[60] p-3 rounded-full shadow-lg transition-all hover:scale-110'
            style={{ 
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              boxShadow: '0 4px 15px var(--shadow)'
            }}
            title={t('exit full screen') + ' (ESC)'}
          >
            <ArrowsPointingInIcon className="w-6 h-6" />
          </button>
        </>
      )}
      
      {/* Normal layout structure - always rendered to preserve ReadContent state */}
      <div className='h-full'>
        <SplitPane
          split="vertical"
          minSize={containerWidth * 0.6}
          maxSize={containerWidth * 0.8}
          size={rightPanelCollapsed ? '100%' : containerWidth * 0.8}
          resizerStyle={rightPanelCollapsed || fullScreen ? { display: 'none' } : { background: 'var(--border-primary)', cursor: 'col-resize', width: '4px' }}
        >
          <SplitPane
            split="vertical"
            minSize={containerWidth * 0.1}
            maxSize={containerWidth * 0.3}
            size={leftPanelCollapsed ? '0%' : containerWidth * 0.2}
            resizerStyle={leftPanelCollapsed || fullScreen ? { display: 'none' } : { background: 'var(--border-primary)', cursor: 'col-resize', width: '4px' }}
          >
            {/* Left panel - hidden visually in fullscreen but still rendered */}
            <div className={`h-full transition-transform duration-300 ${leftPanelCollapsed || fullScreen ? 'transform -translate-x-full w-0 opacity-0' : 'w-full'}`}>
              <ReadLeftPanel />
            </div>
            <div className='h-full'>
              <BodyWithFixedHeader scrollRef={normalScrollRef}>
                {/* ReadControls - hidden in fullscreen */}
                <div className={fullScreen ? 'hidden' : ''}>
                  <ReadControls />
                </div>
                {/* ReadContent wrapper - uses fixed positioning when fullscreen to overlay everything */}
                <div 
                  ref={fullscreenScrollRef}
                  className={fullScreen 
                    ? 'fixed inset-0 z-50 h-full overflow-auto pt-4 px-4' 
                    : ''
                  }
                  style={fullScreen ? { backgroundColor: 'var(--bg-primary)' } : undefined}
                  onMouseMove={fullScreen ? handleMouseMove : undefined}
                >
                  <ReadContent />
                </div>
              </BodyWithFixedHeader>
            </div>
          </SplitPane>
          {/* Right panel - hidden visually in fullscreen but still rendered */}
          <div className={`h-full transition-transform duration-300 ${rightPanelCollapsed || fullScreen ? 'transform translate-x-full w-0 opacity-0' : 'w-full'}`}>
            <ReadRightPanel />
          </div>
        </SplitPane>
      </div>
    </div>
  );
};

export default ReadBody;
