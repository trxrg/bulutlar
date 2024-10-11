import { useEffect, useState, useContext } from "react";
import ActionButton from "../common/ActionButton";
import { categoryApi } from "../../backend-adapter/BackendAdapter";
import { DBContext } from "../../store/db-context";

const generateRandomColor = () => {
    const randomColor = Math.floor(Math.random() * 16777215).toString(16);
    return `#${randomColor.padStart(6, '0')}`;
};

const AddCategory = ({ onClose }) => {

    const [color, setColor] = useState(generateRandomColor());
    const [name, setName] = useState('');
    const [msg, setMsg] = useState('');

    const { fetchAllCategories } = useContext(DBContext);

    useEffect(() => {
        setColor(generateRandomColor());
    }, []);

    const handleAddCategory = async (event) => {
        event.preventDefault();

        if (!name) {
            setMsg('Name cannot be empty');
            return;
        }

        const result = await categoryApi.create({ name: name, color: color });
        if (result.error) {
            console.log('createCategory returned an error');
            console.log(result);
            setMsg(result.error.message || 'validation error');
            return;
        }
        fetchAllCategories();
        onClose();
        setName('');
        setColor(generateRandomColor());
    }

    const handleTextChange = (e) => {
        setMsg('');
        setName(e.target.value)
    }

    return (
        <div>
            {msg ? <span className="text-red-400">{msg}</span> : <span>Enter category name and pick color:</span> }
            <div className='flex gap-2'>
                <input
                    type="text"
                    value={name}
                    onChange={handleTextChange}
                    className="shadow appearance-none border rounded flex-1 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
                <input
                    type="color"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="mt-1 border-0 p-0 cursor-pointer" />
                <ActionButton color='blue' onClick={handleAddCategory}>Add</ActionButton>
            </div>
        </div>
    );
}

export default AddCategory;