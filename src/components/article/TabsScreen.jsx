import React, { useContext, useEffect, useRef } from 'react';
import SearchScreen from './search/SearchScreen.jsx';
import { AppContext } from '../../store/app-context.jsx'
import { DBContext } from '../../store/db-context.jsx';
import ReadContextProvider from '../../store/read-context.jsx';
import { HomeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

import { XMarkIcon } from '@heroicons/react/24/solid';
import ReadScreen from './read/ReadScreen.jsx';
import FormatButton from '../common/FormatButton.jsx';
import ThemeToggle from '../common/ThemeToggle.jsx';
import SaveConfirmModal from '../common/SaveConfirmModal.jsx';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Tab Component
const SortableTab = ({ tab, isActive, onTabClick, onCloseTab, getTitle }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, 0, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
    boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.15), 0 0 8px rgba(0,0,0,0.10)' : 'none',
  };

  return (
    <div
      ref={setNodeRef}
      className="group min-w-60 py-2 px-2 inline-flex items-center cursor-pointer border-b-4 border-transparent tab-item focus:outline-none relative text-left"
      style={{
        backgroundColor: isActive ? 'var(--bg-primary)' : 'var(--bg-secondary)',
        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
        fontWeight: isActive ? '600' : '400',
        transform: isActive ? 'translateY(-1px)' : 'translateY(0)',
        zIndex: isActive ? 10 : 1,
        ...style
      }}
      onClick={() => onTabClick(tab.id)}
      {...attributes}
      {...listeners}
    >
      {getTitle(tab.id)}
      {tab.id != 'search' && (
        <button
          className="absolute right-1 top-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100 p-1 rounded tab-close-button"
          onClick={(e) => {
            e.stopPropagation();
            onCloseTab(tab.id);
          }}
        >
          <XMarkIcon className="w-4 h-4" style={{ color: 'inherit' }} />
        </button>
      )}
    </div>
  );
};

const TabsScreen = () => {
  const { 
    activeTabId, setActiveTabId, closeTab, reorderTabs, tabs, translate: t, setActiveScreen, isMac,
    saveConfirmModal, handleSaveAndClose, handleDiscardAndClose, handleCancelClose
  } = useContext(AppContext);
  const { allArticles, fetchAllData } = useContext(DBContext);
  
  // Track the previous tab to enable toggling back from search
  const previousTabIdRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleTabClick = (tabId) => {
    setActiveTabId(tabId);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = tabs.findIndex(tab => tab.id === active.id);
      const newIndex = tabs.findIndex(tab => tab.id === over.id);
      reorderTabs(oldIndex, newIndex);
    }
  };

  const getArticle = (articleId) => {
    const result = allArticles.find(article => article.id === articleId);
    return result;
  }

  const getTitle = (articleId) => {
    if (articleId === 'search')
      return t('search screen');

    const result = allArticles.find(article => article.id == articleId);

    if (result)
      return truncateTitle(result.title);

    return 'Title: ' + articleId;
  }

  const truncateTitle = (title) => {
    if (!title)
      return "";
    const maxLength = 23;
    if (title.length > maxLength)
      return title.slice(0, maxLength - 3) + '...';

    return title;
  }

  const handleRefresh = async () => {
    await fetchAllData();
  }

  // Track previous tab (excluding search tab)
  useEffect(() => {
    if (activeTabId !== 'search') {
      previousTabIdRef.current = activeTabId;
    }
  }, [activeTabId]);

  // Keyboard shortcuts for tab navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+G or Cmd+G to toggle between search tab and previous tab
      if ((e.ctrlKey || e.metaKey) && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        
        if (activeTabId === 'search') {
          // If in search tab, go back to previous tab if it exists
          if (previousTabIdRef.current && tabs.some(tab => tab.id === previousTabIdRef.current)) {
            setActiveTabId(previousTabIdRef.current);
          }
        } else {
          // If not in search tab, go to search tab
          setActiveTabId('search');
        }
      }

      // Cmd+ArrowLeft (Mac) or Alt+ArrowLeft (Windows) to go to previous tab
      const modifierKey = isMac ? e.metaKey : e.altKey;
      if (modifierKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        const currentIndex = tabs.findIndex(tab => tab.id === activeTabId);
        if (currentIndex > 0) {
          setActiveTabId(tabs[currentIndex - 1].id);
        }
      }

      // Cmd+ArrowRight (Mac) or Alt+ArrowRight (Windows) to go to next tab
      if (modifierKey && e.key === 'ArrowRight') {
        e.preventDefault();
        const currentIndex = tabs.findIndex(tab => tab.id === activeTabId);
        if (currentIndex < tabs.length - 1) {
          setActiveTabId(tabs[currentIndex + 1].id);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTabId, setActiveTabId, tabs]);

  return (
    <>
      <style>
        {`
          .tab-item.active {
            position: relative;
            z-index: 10;
          }
          
          .tab-item.active::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
            border-radius: 4px 4px 0 0;
            pointer-events: none;
          }
        `}
      </style>
      <div className="h-full w-full flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
        {/* Top-aligned tabs */}
        <div className='flex flex-shrink-0 justify-between' style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <div 
            className="flex flex-1 overflow-x-auto overflow-y-hidden relative tab-container"
            style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--text-secondary) transparent'
            }}
          >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={tabs.map(tab => tab.id)} strategy={horizontalListSortingStrategy}>
              {tabs.map(tab => (
                <SortableTab
                  key={tab.id}
                  tab={tab}
                  isActive={activeTabId === tab.id}
                  onTabClick={handleTabClick}
                  onCloseTab={closeTab}
                  getTitle={getTitle}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
        <div className='flex flex-shrink-0 flex-row items-center px-2 gap-1'>
          <ThemeToggle />
          <FormatButton onClick={handleRefresh} title={t('refresh')}><ArrowPathIcon className='w-5 h-5' /></FormatButton>
          <FormatButton onClick={() => setActiveScreen('home')} title={t('homescreen')}><HomeIcon className='w-5 h-5' /></FormatButton>
        </div>
      </div>

      {/* Tab content */}
      <div className='flex-1 overflow-hidden' style={{ backgroundColor: 'var(--bg-primary)' }}>
        {tabs.map(tab => (
          <div key={tab.id} className={activeTabId === tab.id ? 'h-full' : 'hidden'}>
            {tab.id == 'search' ?
              <SearchScreen />
              :
              <ReadContextProvider article={getArticle(tab.id)}>
                <ReadScreen />
              </ReadContextProvider>
            }
          </div>
        ))}
      </div>
      
      {/* Save confirmation modal */}
      <SaveConfirmModal
        isOpen={saveConfirmModal.isOpen}
        onClose={handleCancelClose}
        onSave={handleSaveAndClose}
        onDiscard={handleDiscardAndClose}
      />
    </div>
    </>
  );
};

export default TabsScreen;
