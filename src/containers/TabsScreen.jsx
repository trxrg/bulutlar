import React, { useState } from 'react';
import SearchScreen from './SearchScreen';
import ArticleRead from '../components/ArticleRead';

const TabsScreen = () => {
  const [tabs, setTabs] = useState([
    { id: 'search', title: 'Search' }
  ]);

  const [activeTab, setActiveTab] = useState('search'); // State to track active tab
  const [newTabCount, setNewTabCount] = useState(4); // Counter for generating new tab IDs

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };

  const handleAddTab = (article) => {
    console.log(article);
    if (tabs.map(tab => tab.id).includes(article.id))
      return;
    const newTabId = article.id;
    const newTabTitle = article.title;
    const newTabs = [...tabs, { id: newTabId, title: newTabTitle, content: article }];
    setTabs(newTabs);
    setActiveTab(newTabId);
    setNewTabCount(newTabCount + 1);
  };

  const handleCloseTab = (tabId) => {
    const updatedTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(updatedTabs);
    if (activeTab === tabId && updatedTabs.length > 0) {
      setActiveTab(updatedTabs[0].id); // Activate the first tab if the closed tab was active
    }
  };

  return (
    <div className="h-full border border-green-300">
      {/* Top-aligned tabs */}
      <div className="h-[10%] flex border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${
              activeTab === tab.id
                ? 'bg-gray-100 text-gray-800'
                : 'bg-white text-gray-500'
            } py-2 px-4 inline-flex items-center border-b-2 border-transparent hover:border-gray-300 focus:outline-none relative text-left`}
            onClick={() => handleTabClick(tab.id)}
          >
            {tab.title}
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
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className='h-[90%] border border-red-800'>
        {tabs.map(tab => (
          <div key={tab.id} className={activeTab === tab.id ? 'h-full relative' : 'hidden'}>
            {tab.id == 'search' ? <SearchScreen handleSearchResultClicked={handleAddTab}></SearchScreen> : <ArticleRead article={tab.content}></ArticleRead>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TabsScreen;
