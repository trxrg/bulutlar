import React, { useContext } from 'react';
import SearchScreen from './search/SearchScreen.jsx';
import { AppContext } from '../../store/app-context.jsx'
import { DBContext } from '../../store/db-context.jsx';
import ReadContextProvider from '../../store/read-context.jsx';

import { XMarkIcon } from '@heroicons/react/24/solid';
import ReadScreen from './read/ReadScreen.jsx';

const TabsScreen = () => {

  const { activeTabId, setActiveTabId, closeTab, tabs, translate: t } = useContext(AppContext);
  const { allArticles, } = useContext(DBContext);

  const handleTabClick = (tabId) => {
    setActiveTabId(tabId);
  };

  const getArticle = (articleId) => {
    const result = allArticles.find(article => article.id === articleId);
    return result;
  }

  const getTitle = (articleId) => {
    if (articleId === 'search')
      return t('search');

    const result = allArticles.find(article => article.id == articleId);

    if (result)
      return truncateTitle(result.title);

    return 'Title: ' + articleId;
  }

  const truncateTitle = (title) => {
    if (!title)
      return "";
    const maxLength = 20;
    if (title.length > maxLength)
      return title.slice(0, maxLength-3) + '...';

    return title;
  }

  return (
    <div className="h-full w-full flex flex-col">
      {/* Top-aligned tabs */}
      <div className="flex-shrink-0 flex overflow-auto relative bg-[#E7ECD8]">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`${activeTabId === tab.id
              ? 'bg-white'
              : 'bg-stone-200'
              } text-gray-800 group min-w-40  py-2 px-2 inline-flex items-center cursor-pointer border-b-4 border-transparent hover:border-[#809671] focus:outline-none relative text-left`}
            onClick={() => handleTabClick(tab.id)}
          >
            {getTitle(tab.id)}
            {tab.id != 'search' && ( 
              <button
                className="absolute right-0 top-0 text-red-700 hover:text-red-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
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

      {/* Tab content */}
      <div className='flex-1 overflow-hidden'>
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
