import { useState, useContext } from "react";
import ActionButton from "../common/ActionButton";
import { groupApi } from "../../backend-adapter/BackendAdapter";
import { DBContext } from "../../store/db-context";
import { AppContext } from "../../store/app-context";
import toastr from "toastr";

const AddGroup = ({ onClose }) => {

    const [name, setName] = useState('');
    const [msg, setMsg] = useState('');

    const { fetchAllGroups } = useContext(DBContext);
    const { translate: t } = useContext(AppContext);

    const handleAddGroup = async (event) => {
        event.preventDefault();

        if (!name) {
            setMsg(t('Name cannot be empty'));
            return;
        }

        try {
            const result = await groupApi.create({ name: name });
            if (result.error) {
                console.log('createGroup returned an error');
                console.log(result);
                setMsg(result.error.message || 'validation error');
                return;
            }
        } catch (error) {
            console.error('createGroup returned an error', error);
            toastr.error(t('error creating group'));
            return;
        }
        toastr.success(t('group created'));
        setName('');
        fetchAllGroups();
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
                    placeholder={t('group name')}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            handleAddGroup(e);
                        }
                    }}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
                <ActionButton color='blue' onClick={handleAddGroup}>{t('add')}</ActionButton>
            </div>
        </div>
    );
}

export default AddGroup;