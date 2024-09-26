import { useEffect, useState, useContext } from "react";
import ActionButton from "../../components/ActionButton";
import { createCategory } from "../../backend-adapter/BackendAdapter";
import { AppContext } from "../../store/app-context";

const generateRandomColor = () => {
    const randomColor = Math.floor(Math.random() * 16777215).toString(16);
    return `#${randomColor.padStart(6, '0')}`;
};

const AddCategory = ({ onClose }) => {

    const [color, setColor] = useState(generateRandomColor());
    const [name, setName] = useState('');
    const [msg, setMsg] = useState('');

    const { getAllCategoriesFromBE } = useContext(AppContext);

    useEffect(() => {
        setColor(generateRandomColor());
    }, []);

    const handleAddCategory = async (event) => {
        event.preventDefault();

        if (!name) {
            setMsg('Name cannot be empty');
            return;
        }

        const result = await createCategory({ name: name, color: color });
        if (result.error) {
            console.log('createCategory returned an error');
            console.log(result);
            setMsg('Category names must be unique');
            return;
        }
        getAllCategoriesFromBE();
        onClose();
    }

    const handleTextChange = (e) => {
        setMsg('');
        setName(e.target.value)
    }

    return (
        <div>
            {msg ? <span className="text-red-400">{msg}</span> : <span>Enter category name:</span> }
            <div className='flex gap-2'>
                <input
                    type="text"
                    value={name}
                    onChange={handleTextChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
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