import { useState } from 'react';

import './App.css';
import OwnerTest from './OwnerTest';
import TagTest from './TagTest';
import ArticleTest from './ArticleTest';

import SearchResult from './components/SearchResult';
import ReadPanel from './components/ReadPanel';
import { ARTICLES } from './data/Articles'

import { getAllArticles } from './backend-adapter/BackendAdapter';

function App() {

  if (window.process) {
    window.process.on('uncaughtException', function (error) {
      const { app, dialog } = window.require("electron").remote;
      console.log('error');
      dialog.showMessageBoxSync({ type: 'error', message: "Unexpected error occurred. Restarting the application.", title: "Erroradfafasdfa" });
      // app.relaunch();
      // app.quit();
    });
  }

  const [activeScreen, setActiveScreen] = useState();
  const [activeArticleId, setActiveArticleId] = useState(1);
  const [returnedArticles, setreturnedArticles] = useState([]);

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

  async function search() {
      try {
        let articles = await getAllArticles();
        console.log(articles);
        setreturnedArticles(articles);
      } catch (err) {
        console.error(err);
      }
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
      <div>
        <button onClick={search}>Search</button>
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
            <SearchResult handleClick={onArticleClick} articles={returnedArticles} />
          </div>
          <div className='bg-red-500 col-span-7'>
            <ReadPanel article={returnedArticles.find(article => article.id === activeArticleId)} />
          </div>
        </div> : undefined}
    </div>
  );
}

export default App;