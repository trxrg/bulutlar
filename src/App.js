import './App.css';
import { checkDbConnection, getFromDb, ping } from './backend-adapter/BackendAdapter';

function App() {

  async function handleClick() {
    ping().then( response => console.log(response));
  }

  async function handleClick2() {
    checkDbConnection().then( response => console.log(response));
  }

  async function handleClick3() {
    getFromDb().then( response => console.log(response));
  }

  return (
    <div className="App">
      <h1>
        React, Electron, Sqlite3, Sequelize Test Program (Check the console)
      </h1>
      <div>
        <button onClick={handleClick}>Ping (ipc)</button>
      </div>
      <div>
        <button onClick={handleClick2}>Check DB Connection</button>
      </div>
      <div>
        <button onClick={handleClick3}>Get Orchestras DB</button>
      </div>
    </div>
  );
}

export default App;