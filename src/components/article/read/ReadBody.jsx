import React, { useState, useEffect, useLayoutEffect, useContext, useRef } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
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

const resizerStyle = { width: '4px', background: 'var(--border-primary)', cursor: 'col-resize', outline: 'none' };
// Applied to Panel's inner content div (height + overflow make h-full chain work inside)
const panelContentStyle = { height: '100%', overflow: 'hidden' };

const ReadBody = ({ controlsTrigger, showControls, hideControls, controlsPinnedRef }) => {

  const { leftPanelCollapsed, rightPanelCollapsed, article, getOwnerName, getCategoryName, beforeFullScreenToggleRef, editable, headerCompact, setHeaderCompact } = useContext(ReadContext);
  const { fullScreen, setFullScreen, translate: t, autoHideControls } = useContext(AppContext);
  const { fetchArticleById } = useContext(DBContext);

  const [headerVisible, setHeaderVisible] = useState(false);

  const leftPanelRef = useRef(null);
  const rightPanelRef = useRef(null);

  // Refs for scroll containers
  const fullscreenScrollRef = useRef(null);
  const normalScrollRef = useRef(null);

  // Store scroll position info when switching modes
  const scrollPositionRef = useRef({ scrollRatio: 0 });

  // Track scroll direction to compact/expand header
  const lastScrollTopRef = useRef(0);
  const suppressScrollRef = useRef(false);
  const suppressTimeoutRef = useRef(null);

  const suppressScrollHandling = (duration = 400) => {
    suppressScrollRef.current = true;
    clearTimeout(suppressTimeoutRef.current);
    suppressTimeoutRef.current = setTimeout(() => {
      suppressScrollRef.current = false;
      const container = normalScrollRef.current;
      if (container) lastScrollTopRef.current = container.scrollTop;
    }, duration);
  };

  useEffect(() => {
    return () => clearTimeout(suppressTimeoutRef.current);
  }, []);

  useEffect(() => {
    const container = normalScrollRef.current;
    if (!container) return;

    const SCROLL_THRESHOLD = 30;

    const handleScroll = () => {
      if (suppressScrollRef.current) return;

      const scrollTop = container.scrollTop;
      const delta = scrollTop - lastScrollTopRef.current;

      if (delta > SCROLL_THRESHOLD) {
        setHeaderCompact(true);
        lastScrollTopRef.current = scrollTop;
      } else if (delta < -SCROLL_THRESHOLD || scrollTop < SCROLL_THRESHOLD) {
        setHeaderCompact(false);
        lastScrollTopRef.current = scrollTop;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [setHeaderCompact]);

  // Suppress scroll handling during the headerCompact CSS transition (300ms)
  // to prevent layout-induced scroll events from toggling it back.
  useLayoutEffect(() => {
    const container = normalScrollRef.current;
    if (container) lastScrollTopRef.current = container.scrollTop;
    suppressScrollHandling(350);
  }, [headerCompact]);

  // Drive panel collapse/expand imperatively from context state
  useEffect(() => {
    suppressScrollHandling();
    if (leftPanelCollapsed) leftPanelRef.current?.collapse();
    else leftPanelRef.current?.expand();
    hideControls();
  }, [leftPanelCollapsed]);

  useEffect(() => {
    suppressScrollHandling();
    if (rightPanelCollapsed) rightPanelRef.current?.collapse();
    else rightPanelRef.current?.expand();
    hideControls();
  }, [rightPanelCollapsed]);

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

  // ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && fullScreen) {
        toggleFullScreen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [fullScreen]);

  // Restore scroll position after fullscreen change
  useEffect(() => {
    const container = fullScreen ? fullscreenScrollRef.current : normalScrollRef.current;
    const { scrollRatio } = scrollPositionRef.current;

    if (!container || scrollRatio === 0) return;

    const restoreScroll = () => {
      const { scrollHeight, clientHeight } = container;
      const maxScroll = scrollHeight - clientHeight;
      container.scrollTop = scrollRatio * maxScroll;
    };

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

  const handleMouseMove = (e) => {
    if (fullScreen) {
      setHeaderVisible(e.clientY < 60);
    }
  };

  const handleStarClick = async (e) => {
    e.stopPropagation();
    await articleApi.setIsStarred(article.id, !article.isStarred);
    fetchArticleById(article.id);
  };

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
              if (e.clientY > 60) setHeaderVisible(false);
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

      <div className='h-full'>
        <Group className='h-full'>

          <Panel panelRef={leftPanelRef} defaultSize="20" minSize="15" maxSize="30" collapsible style={panelContentStyle}>
            <ReadLeftPanel />
          </Panel>

          <Separator style={leftPanelCollapsed || fullScreen ? { display: 'none' } : resizerStyle} />

          <Panel defaultSize="60" minSize="40" style={panelContentStyle}>
            <BodyWithFixedHeader scrollRef={normalScrollRef}>
                {/* Auto-hide overlay relies on BodyWithFixedHeader's header slot having "relative z-10" */}
                <div className={fullScreen ? 'hidden' : ''}>
                  {autoHideControls && !editable ? (
                    <div
                      className={`absolute left-0 right-0 z-20 transition-all duration-300 ease-in-out ${
                        controlsTrigger
                          ? 'opacity-100 translate-y-0'
                          : 'opacity-0 -translate-y-full pointer-events-none'
                      }`}
                      style={{ boxShadow: controlsTrigger ? '0 10px 25px -5px var(--shadow)' : 'none' }}
                      onMouseEnter={showControls}
                      onMouseLeave={hideControls}
                    >
                      <ReadControls controlsPinnedRef={controlsPinnedRef} showControls={showControls} hideControls={hideControls} />
                    </div>
                  ) : (
                    <ReadControls />
                  )}
                </div>
                {/* Uses fixed positioning in fullscreen to overlay everything */}
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
          </Panel>

          <Separator style={rightPanelCollapsed || fullScreen ? { display: 'none' } : resizerStyle} />

          <Panel panelRef={rightPanelRef} defaultSize="20" minSize="15" maxSize="30" collapsible style={panelContentStyle}>
            <ReadRightPanel />
          </Panel>

        </Group>
      </div>
    </div>
  );
};

export default ReadBody;
