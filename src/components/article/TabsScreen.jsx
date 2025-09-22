import React, { useContext } from 'react';
import SearchScreen from './search/SearchScreen.jsx';
import { AppContext } from '../../store/app-context.jsx'
import { DBContext } from '../../store/db-context.jsx';
import ReadContextProvider from '../../store/read-context.jsx';
import { HomeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

import { XMarkIcon } from '@heroicons/react/24/solid';
import ReadScreen from './read/ReadScreen.jsx';
import FormatButton from '../common/FormatButton.jsx';
import ThemeToggle from '../common/ThemeToggle.jsx';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
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
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      className="group min-w-60 py-2 px-2 inline-flex items-center cursor-pointer border-b-4 border-transparent tab-item focus:outline-none relative text-left"
      style={{
        backgroundColor: isActive ? 'var(--bg-primary)' : 'var(--bg-secondary)',
        color: 'var(--text-primary)',
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
  const [activeId, setActiveId] = React.useState(null);

  const { activeTabId, setActiveTabId, closeTab, reorderTabs, tabs, translate: t, setActiveScreen } = useContext(AppContext);
  const { allArticles, fetchAllData } = useContext(DBContext);

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

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

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

  return (
    <>
      <style>
        {`
          .tab-container.dragging {
            overflow-y: hidden !important;
            pointer-events: none;
          }
          .tab-container.dragging * {
            pointer-events: none;
          }
        `}
      </style>
      <div className="h-full w-full flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
        {/* Top-aligned tabs */}
        <div className='flex flex-shrink-0 justify-between' style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <div 
            className={`flex flex-1 overflow-x-auto overflow-y-hidden relative tab-container ${activeId ? 'dragging' : ''}`}
            style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--text-secondary) transparent'
            }}
          >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
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
            <DragOverlay>
              {activeId ? (
                <div className="group min-w-60 py-2 px-2 inline-flex items-center cursor-pointer border-b-4 border-transparent tab-item focus:outline-none relative text-left opacity-90"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    transform: 'rotate(5deg)',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                  }}
                >
                  {getTitle(activeId)}
                </div>
              ) : null}
            </DragOverlay>
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
    </div>
    </>
  );
};

export default TabsScreen;
