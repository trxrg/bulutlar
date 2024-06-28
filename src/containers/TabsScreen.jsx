import React from 'react';
import SearchScreen from './SearchScreen';
import ArticleRead from '../components/ArticleRead';

const TabsScreen = ({ onEditClicked, handleLinkClicked, activeTabId, setActiveTabId, handleAddTab, handleCloseTab, tabs, allArticles }) => {

  const handleTabClick = (tabId) => {
    setActiveTabId(tabId);
  };

  const handleEditClicked = (article) => {
    onEditClicked(article);
  }

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
    <div className="h-full border border-green-300">
      {/* Top-aligned tabs */}
      <div className="h-[10%] flex border-b border-gray-200">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`${activeTabId === tab.id
              ? 'bg-gray-100 text-gray-800'
              : 'bg-white text-gray-500'
              } py-2 px-4 inline-flex items-center border-b-2 border-transparent hover:border-gray-300 focus:outline-none relative text-left`}
            onClick={() => handleTabClick(tab.id)}
          >
            {getTitle(tab.id)}
            {tab.id != 'search' && ( // Render close button if there's more than one tab
              <button
                className="ml-2 text-red-700 hover:text-red-500"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent tab click event from firing
                  handleCloseTab(tab.id);
                }}
              >
                &#10006;
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Tab content */}
      <div className='h-[90%] border border-red-800'>
        {tabs.map(tab => (
          <div key={tab.id} className={activeTabId === tab.id ? 'h-full relative' : 'hidden'}>
            {tab.id == 'search' ?
              <SearchScreen handleSearchResultClicked={handleAddTab} allArticles={allArticles}></SearchScreen>
              :
              <ArticleRead article={getArticle(tab.id)} onEditClicked={handleEditClicked} onLinkClicked={handleLinkClicked}></ArticleRead>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TabsScreen;
