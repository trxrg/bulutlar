import { useState } from 'react';

import './App.css';
import { addOwner, getAllOwners } from './backend-adapter/BackendAdapter';

function App() {

  const [inputs, setInputs] = useState({});

  const handleChange = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setInputs(values => ({...values, [name]: value}))
  }

  const handleSubmit1 = (event) => {
    event.preventDefault();
    addOwner(inputs.ownerName);
  }

  async function getOwners() {
    getAllOwners().then( response => console.log(response.map(item => item.dataValues)));
  }
  
  return (
    <div className="App">
      <form onSubmit={handleSubmit1}>
        <label>Enter name for owner:
          <input type='text' name='ownerName' value={inputs.ownerName || ""} onChange={handleChange} />
        </label>
        <input type="submit" />
      </form>
      <div>
        <button onClick={getOwners}>Get All Owners</button>
      </div>
    </div>
  );
}

export default App;