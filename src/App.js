import { useState } from 'react';

import './App.css';
import AddArticle from './containers/AddArticle';
import MainScreen from './containers/MainScreen';

import Sketch from './test-screens/Sketch';

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

  function handleSelectAddArticle() {
    setActiveScreen("addArticle");
  }

  function handleSelectMainScreen() {
    setActiveScreen("mainScreen");
  }

  function handleSelectTest() {
    setActiveScreen("test");
  }

  return (
    <div>
      <div>
        <button onClick={handleSelectMainScreen}>Main Screen</button>
      </div>
      <div>
        <button onClick={handleSelectAddArticle}>Add Article</button>
      </div>
      <div>
        <button onClick={handleSelectTest}>Test</button>
      </div>
      {activeScreen == "mainScreen" ? <MainScreen></MainScreen> : undefined}
      {activeScreen == "addArticle" ? <AddArticle></AddArticle> : undefined}
      {activeScreen == "test" ? <Sketch></Sketch> : undefined}      
    </div>
  );
}

export default App;