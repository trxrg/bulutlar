import React, { useState, useContext, useEffect } from 'react';
import GeneralModal from '../common/GeneralModal';
import { AppContext } from '../../store/app-context';
import { DBContext } from '../../store/db-context.jsx';

const StreakModal = ({ isOpen, onRequestClose }) => {

    const { streak } = useContext(DBContext);
    const { translate: t } = useContext(AppContext);

    const [msg, setMsg] = useState('');

    const configMsg = () => {
        if (streak <= 0) {
            setMsg(t('streak message 0'));
            return;
        }

        if (streak == 1)
            setMsg('streak message 1');
        else if (streak == 2)
            setMsg('streak message 2');
        else if (streak < 5)
            setMsg('streak message 3');
        else if (streak < 10)
            setMsg('streak message 5');
        else if (streak < 15)
            setMsg('streak message 10');
        else
            setMsg('streak message 15');
    }

    useEffect(() => {
        configMsg();
    }, [streak]);

    return (
        <GeneralModal isOpen={isOpen} onRequestClose={onRequestClose}>
            <div className='flex flex-col h-full items-center overflow-y-auto'>
                <div className='flex items-center gap-2 mx-2 mb-10'>
                    <span className='text-5xl text-green-600 font-bold'>⚡{streak}</span>
                </div>
                <div className='text-xl'>
                    <p>{t(msg)}</p>
                </div>
            </div>
        </GeneralModal>
    );
};

export default StreakModal;