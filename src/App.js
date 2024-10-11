import './App.css';
import MainScreen from './components/MainScreen';
import AppContextProvider from './store/app-context';
import DBContextProvider from './store/db-context';

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
    <div className='bg-stone-300'>
      <DBContextProvider>
        <AppContextProvider>
          <MainScreen></MainScreen>
        </AppContextProvider>
      </DBContextProvider>
    </div>
  );
}

export default App;