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

const TabsScreen = () => {

  const { activeTabId, setActiveTabId, closeTab, tabs, translate: t, setActiveScreen } = useContext(AppContext);
  const { allArticles, fetchAllData } = useContext(DBContext);

  const handleTabClick = (tabId) => {
    setActiveTabId(tabId);
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
    <div className="h-full w-full flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Top-aligned tabs */}
      <div className='flex flex-shrink-0 justify-between' style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        <div className="flex flex-1 overflow-auto relative">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className="group min-w-60 py-2 px-2 inline-flex items-center cursor-pointer border-b-4 border-transparent focus:outline-none relative text-left"
              style={{
                backgroundColor: activeTabId === tab.id ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.borderBottomColor = 'var(--border-primary)'}
              onMouseLeave={(e) => e.target.style.borderBottomColor = 'transparent'}
              onClick={() => handleTabClick(tab.id)}
            >
              {getTitle(tab.id)}
              {tab.id != 'search' && (
                <button
                  className="absolute right-0 top-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ 
                    color: '#dc2626',
                    transition: 'color 0.2s ease, opacity 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#ef4444'}
                  onMouseLeave={(e) => e.target.style.color = '#dc2626'}
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
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
  );
};

export default TabsScreen;
