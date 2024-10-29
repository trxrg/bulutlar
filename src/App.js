import './App.css';
import AppScreen from './components/app/AppScreen';
import ErrorBoundary from './ErrorBoundary';
import AppContextProvider from './store/app-context';
import DBContextProvider from './store/db-context';
import { useEffect } from 'react';

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

  useEffect(() => {
    // Detect if the user is on Windows
    const isWindows = navigator.platform.indexOf('Win') > -1;
    if (isWindows) {
      document.body.classList.add('windows');
    }
  }, []);

  return (
    <div className='bg-stone-300'>
      <ErrorBoundary>
        <DBContextProvider>
          <AppContextProvider>
            <AppScreen />
          </AppContextProvider>
        </DBContextProvider>
      </ErrorBoundary>
    </div>
  );
}

export default App;