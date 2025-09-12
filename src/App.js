import './App.css';
import './styles/themes.css';
import AppScreen from './components/app/AppScreen.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import AppContextProvider from './store/app-context.jsx';
import DBContextProvider from './store/db-context.jsx';
import { ThemeProvider } from './contexts/ThemeContext.js';
import { useEffect } from 'react';
import toastr from 'toastr';
import 'toastr/build/toastr.min.css';
import log from 'electron-log/renderer.js';
import SearchContextProvider from './store/search-context.jsx';
Object.assign(console, log.functions);

// Optional: Configure Toastr options
toastr.options = {
  "closeButton": true,
  "debug": false,
  "newestOnTop": true,
  "progressBar": true,
  "positionClass": "toast-bottom-left",
  "preventDuplicates": false,
  "onclick": null,
  "showDuration": "300",
  "hideDuration": "1000",
  "timeOut": "5000",
  "extendedTimeOut": "1000",
  "showEasing": "swing",
  "hideEasing": "linear",
  "showMethod": "fadeIn",
  "hideMethod": "fadeOut"
};

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
    <div style={{ backgroundColor: 'var(--bg-stone)' }}>
      <ThemeProvider>
        <ErrorBoundary>
          <DBContextProvider>
            <AppContextProvider>
              <SearchContextProvider>
                <AppScreen />
              </SearchContextProvider>
            </AppContextProvider>
          </DBContextProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </div>
  );
}

export default App;