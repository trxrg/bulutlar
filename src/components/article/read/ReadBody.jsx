import React, { useState, useEffect, useContext } from 'react';
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

  const { leftPanelCollapsed, rightPanelCollapsed, article, getOwnerName, getCategoryName } = useContext(ReadContext);
  const { fullScreen, setFullScreen, translate: t } = useContext(AppContext);
  const { fetchArticleById } = useContext(DBContext);

  const [containerWidth, setContainerWidth] = useState(window.innerWidth);
  const [headerVisible, setHeaderVisible] = useState(false);

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
        setFullScreen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [fullScreen, setFullScreen]);

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

  // Fullscreen mode - render only ReadContent with a hover header
  if (fullScreen) {
    return (
      <div 
        className='fixed inset-0 z-50 overflow-auto'
        style={{ backgroundColor: 'var(--bg-primary)' }}
        onMouseMove={handleMouseMove}
      >
        {/* Hover Header */}
        <div 
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'
          }`}
          style={{ 
            backgroundColor: 'var(--bg-secondary)',
            boxShadow: '0 4px 6px -1px var(--shadow)',
          }}
          onMouseEnter={() => setHeaderVisible(true)}
          onMouseLeave={(e) => {
            // Only hide if mouse is moving down (away from header)
            if (e.clientY > 60) {
              setHeaderVisible(false);
            }
          }}
        >
          <div className='flex items-center justify-between px-4 py-3'>
            {/* Left - Article info */}
            <div className='flex items-center gap-4'>
              <div onClick={handleStarClick} className='flex items-center cursor-pointer'>
                {article.isStarred ? (
                  <StarIcon style={{ fontSize: '1.5rem', color: '#FFD700' }} className="hover:scale-125" />
                ) : (
                  <StarBorderIcon style={{ fontSize: '1.5rem', color: '#B0B0B0' }} className="hover:scale-125" />
                )}
              </div>
              <div className='flex flex-col'>
                <h2 
                  className='text-lg font-semibold'
                  style={{ color: 'var(--text-primary)' }}
                >
                  {article.title}
                </h2>
                <div 
                  className='flex gap-3 text-sm'
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {!article.isDateUncertain && (
                    <span>{new Date(article.date).toLocaleDateString('tr')}</span>
                  )}
                  {getOwnerName() && <span>• {getOwnerName()}</span>}
                  {getCategoryName() && <span>• {getCategoryName()}</span>}
                </div>
              </div>
            </div>
            
            {/* Right - Exit button */}
            <button
              onClick={() => setFullScreen(false)}
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

        {/* Main content */}
        <div className='h-full overflow-auto pt-4 px-4'>
          <ReadContent />
        </div>

        {/* Floating exit button at bottom right (always visible) */}
        <button
          onClick={() => setFullScreen(false)}
          className='fixed bottom-6 right-6 p-3 rounded-full shadow-lg transition-all hover:scale-110'
          style={{ 
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            boxShadow: '0 4px 15px var(--shadow)'
          }}
          title={t('exit full screen') + ' (ESC)'}
        >
          <ArrowsPointingInIcon className="w-6 h-6" />
        </button>
      </div>
    );
  }

  // Normal mode
  return (
    <div className='h-full relative'>
      <SplitPane
        split="vertical"
        minSize={containerWidth * 0.6}
        maxSize={containerWidth * 0.8}
        size={rightPanelCollapsed ? '100%' : containerWidth * 0.8}
        resizerStyle={rightPanelCollapsed ? { display: 'none' } : { background: 'var(--border-primary)', cursor: 'col-resize', width: '4px' }}
      >
        <SplitPane
          split="vertical"
          minSize={containerWidth * 0.1}
          maxSize={containerWidth * 0.3}
          size={leftPanelCollapsed ? '0%' : containerWidth * 0.2}
          resizerStyle={leftPanelCollapsed ? { display: 'none' } : { background: 'var(--border-primary)', cursor: 'col-resize', width: '4px' }}
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
