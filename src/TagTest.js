import { useState } from 'react';

import './App.css';
import { addOwner, getAllOwners, getOwnerWithName, getOwnerWithId, getOwnerWithNameLike, deleteOwnerWithName } from './backend-adapter/BackendAdapter';


function TagTest() {

    const [inputs, setInputs] = useState({});

    const handleChange = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setInputs(values => ({ ...values, [name]: value }))
    }

    const handleSubmit1 = async (event) => {

        event.preventDefault();
        try {
            const result = await addOwner(inputs.ownerNameToAdd);
            console.log(result);
        } catch (err) {
            console.error(err.message);
        }
    }

    const handleSubmit2 = async (event) => {
        event.preventDefault();
        try {
            const result = await getOwnerWithName(inputs.ownerNameToGet);
            console.log(result);
        } catch (err) {
            console.error(err);
        }
    }

    const handleSubmit3 = async (event) => {
        event.preventDefault();
        try {
            const response = await getOwnerWithId(inputs.ownerIdToGet)
            console.log(response);
        } catch (err) {
            console.error(err);
        }
    }

    const handleSubmit4 = async (event) => {
        event.preventDefault();
        try {
            const response = await getOwnerWithNameLike(inputs.ownerNameLike);
            console.log(response);
        } catch (err) {
            console.error(err);
        }
    }

    const handleSubmit5 = async (event) => {
        event.preventDefault();
        try {
            const response = await deleteOwnerWithName(inputs.ownerNameToDelete);
            console.log(response);
        } catch (err) {
            console.error(err);
        }
    }

    async function getOwners() {
        try {
            const response = await getAllOwners();
            console.log(response);
        } catch (err) {
            console.error(err);
        }
    }

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
        <div className="App">
            <h2>Tag Test</h2>
            <form onSubmit={handleSubmit1}>
                <h2>Add Owner</h2>
                <label>Enter name for owner:
                    <input type='text' name='ownerNameToAdd' value={inputs.ownerNameToAdd || ""} onChange={handleChange} />
                </label>
                <input type="submit" />
            </form>
            <form onSubmit={handleSubmit2}>
                <h2>Get Owner By Name</h2>
                <label>Enter name for owner:
                    <input type='text' name='ownerNameToGet' value={inputs.ownerNameToGet || ""} onChange={handleChange} />
                </label>
                <input type="submit" />
            </form>
            <form onSubmit={handleSubmit3}>
                <h2>Get Owner By Id</h2>
                <label>Enter id for owner:
                    <input type='text' name='ownerIdToGet' value={inputs.ownerIdToGet || ""} onChange={handleChange} />
                </label>
                <input type="submit" />
            </form>
            <form onSubmit={handleSubmit4}>
                <h2>Get Owner By Name Like</h2>
                <label>Enter name for owner:
                    <input type='text' name='ownerNameLike' value={inputs.ownerNameLike || ""} onChange={handleChange} />
                </label>
                <input type="submit" />
            </form>
            <div>
                <h2>Get All Owners</h2>
                <button onClick={getOwners}>Get All Owners</button>
            </div>
            <form onSubmit={handleSubmit5}>
                <h2>Delete Owner By Name</h2>
                <label>Enter name for owner:
                    <input type='text' name='ownerNameToDelete' value={inputs.ownerNameToDelete || ""} onChange={handleChange} />
                </label>
                <input type="submit" />
            </form>
        </div>
    );
}

export default TagTest;