import { useEffect, useState, useContext } from "react";
import ActionButton from "../common/ActionButton";
import { categoryApi } from "../../backend-adapter/BackendAdapter";
import { DBContext } from "../../store/db-context";
import { AppContext } from "../../store/app-context";

const generateRandomColor = () => {
    const randomColor = Math.floor(Math.random() * 16777215).toString(16);
    return `#${randomColor.padStart(6, '0')}`;
};

const AddCategory = ({ onClose }) => {

    const [color, setColor] = useState(generateRandomColor());
    const [name, setName] = useState('');
    const [msg, setMsg] = useState('');

    const { fetchAllCategories } = useContext(DBContext);
    const { translate: t } = useContext(AppContext);

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
        const createdName = name;
        fetchAllCategories();
        onClose(createdName);
        setName('');
        setColor(generateRandomColor());
    }

    const handleTextChange = (e) => {
        setMsg('');
        setName(e.target.value)
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleAddCategory(e);
        }
    };

    return (
        <div>
            {msg && <span className="text-red-400">{msg}</span>}
            <div className='flex gap-2'>
                <input
                    type="text"
                    value={name}
                    placeholder={t('category name')}
                    onChange={handleTextChange}
                    onKeyPress={handleKeyPress}
                    className="shadow appearance-none rounded flex-1 py-2 px-3 leading-tight focus:outline-none focus:shadow-outline"
                    style={{
                        border: '1px solid var(--border-secondary)',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)'
                    }}
                />
                <input
                    type="color"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="mt-1 border-0 p-0 cursor-pointer" />
                <ActionButton color='blue' onClick={handleAddCategory}>{t('add')}</ActionButton>
            </div>
        </div>
    );
}

export default AddCategory;