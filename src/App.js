import { useState } from 'react';

import './App.css';
import OwnerTest from './OwnerTest';
import TagTest from './TagTest';
import ArticleTest from './ArticleTest';

import SearchResult from './components/SearchResult';
import ReadPanel from './components/ReadPanel';
import { ARTICLES } from './data/Articles'

function App() {

  const [activeScreen, setActiveScreen] = useState();

  if (window.process) {
    window.process.on('uncaughtException', function (error) {
      const { app, dialog } = window.require("electron").remote;
      console.log('error');
      dialog.showMessageBoxSync({ type: 'error', message: "Unexpected error occurred. Restarting the application.", title: "Erroradfafasdfa" });
      // app.relaunch();
      // app.quit();
    });
  }

  const [activeArticleId, setActiveArticleId] = useState(1);

  function onArticleClick(articleId) {
    setActiveArticleId(articleId);
  }

  function ownerTest() {
    setActiveScreen("ownerTest");
  }

  function tagTest() {
    setActiveScreen("tagTest");
  }

  function articleTest() {
    setActiveScreen("articleTest");
  }

  function resetTest() {
    setActiveScreen("notest");
  }

  return (
    <div>
      <div>
        <button onClick={ownerTest}>Owner Test</button>
      </div>
      <div>
        <button onClick={tagTest}>Tag Test</button>
      </div>
      <div>
        <button onClick={articleTest}>Article Test</button>
      </div>
      <div>
        <button onClick={resetTest}>Reset Test</button>
      </div>
      {activeScreen == "ownerTest" ? <OwnerTest></OwnerTest> : undefined}
      {activeScreen == "tagTest" ? <TagTest></TagTest> : undefined}
      {activeScreen == "articleTest" ? <ArticleTest></ArticleTest> : undefined}
      {activeScreen == "notest" ?
        <div className='grid grid-cols-10 gap-2 px-2 h-screen'>
          <div className='col-span-10'>
            <h1 className='text-4xl text-center'>BULUTLAR</h1>
          </div>
          <div className='max-h-screen overflow-auto bg-green-500 col-span-3'>
            <SearchResult handleClick={onArticleClick} />
          </div>
          <div className='bg-red-500 col-span-7'>
            <ReadPanel article={ARTICLES.find(article => article.id === activeArticleId)} />
          </div>
        </div> : undefined}
    </div>
  );
}

export default App;