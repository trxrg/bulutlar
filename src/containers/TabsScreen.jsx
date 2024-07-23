import React, { useContext } from 'react';
import SearchScreen from './SearchScreen';
import ReadScreen from './ReadScreen';
import NewReadScreen from './NewReadScreen';
import { AppContext } from '../store/app-context.jsx'

const TabsScreen = () => {

  const { activeTabId, setActiveTabId, closeTab, tabs, allArticles, } = useContext(AppContext);

  const handleTabClick = (tabId) => {
    setActiveTabId(tabId);
  };

  const getArticle = (articleId) => {
    const result = allArticles.find(article => article.id === articleId);
    return result;
  }

  const getTitle = (articleId) => {
    if (articleId === 'search')
      return 'Search';

    const result = allArticles.find(article => article.id == articleId);

    if (result)
      return result.title;

    return 'Title: ' + articleId;
  }

  return (
    <div className="h-full">
      {/* Top-aligned tabs */}
      <div className="h-[10%] flex">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`${activeTabId === tab.id
              ? 'bg-stone-50'
              : 'bg-stone-200'
              } text-gray-800 group py-2 px-4 inline-flex items-center cursor-pointer border-b-4 border-transparent hover:border-red-300 focus:outline-none relative text-left`}
            onClick={() => handleTabClick(tab.id)}
          >
            {getTitle(tab.id)}
            {tab.id != 'search' && ( // Render close button if there's more than one tab
              <button
                className="ml-2 text-red-700 hover:text-red-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent tab click event from firing
                  closeTab(tab.id);
                }}
              >
                &#10006;
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Tab content */}
      <div className='h-[90%]'>
        {tabs.map(tab => (
          <div key={tab.id} className={activeTabId === tab.id ? 'h-full relative' : 'hidden'}>
            {tab.id == 'search' ?
              <SearchScreen/>
              :
              // <ReadScreen article={getArticle(tab.id)} allTags={allTags} onEditClicked={handleEditClicked} onLinkClicked={handleLinkClicked} syncWithDB={syncWithDB}></ReadScreen>
              <NewReadScreen article={getArticle(tab.id)}></NewReadScreen>
              }
          </div>
        ))}
      </div>
    </div>
  );
};

export default TabsScreen;
