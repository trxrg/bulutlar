import { useState } from 'react';

import './App.css';
import AddArticle from './containers/AddArticle';
import MainScreen from './containers/MainScreen';
import SearchScreen from './containers/SearchScreen';

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

  return (
    <div className='bg-gradient-to-r from-stone-800 via-stone-100 to-stone-800'>
      <MainScreen></MainScreen>
    </div>
  );
}

export default App;