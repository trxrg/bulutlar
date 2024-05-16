import { useState } from 'react';

import './App.css';
import OwnerTest from './OwnerTest';
import TagTest from './TagTest';
import ArticleTest from './ArticleTest';


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
    setActiveScreen("no");
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
    </div>
  );


}

export default App;