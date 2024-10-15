import { useState, useContext } from "react";
import ActionButton from "../common/ActionButton";
import { ownerApi } from "../../backend-adapter/BackendAdapter";
import { DBContext } from "../../store/db-context";

const AddOwner = ({ onClose }) => {

    const [name, setName] = useState('');
    const [msg, setMsg] = useState('');

    const { fetchAllOwners } = useContext(DBContext);

    const handleAddOwner = async (event) => {
        event.preventDefault();

        if (!name) {
            setMsg('Name cannot be empty');
            return;
        }

        const result = await ownerApi.create({ name: name });
        if (result.error) {
            console.log('createOwner returned an error');
            console.log(result);
            setMsg(result.error.message || 'validation error');
            return;
        }
        setName('');
        fetchAllOwners();
        onClose();
    }

    const handleTextChange = (e) => {
        setMsg('');
        setName(e.target.value)
    }

    return (
        <div>
            {msg && <span className="text-red-400">{msg}</span>}
            <div className='flex gap-2'>
                <input
                    type="text"
                    value={name}
                    onChange={handleTextChange}
                    placeholder="Owner name"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
                <ActionButton color='blue' onClick={handleAddOwner}>Add</ActionButton>
            </div>
        </div>
    );
}

export default AddOwner;