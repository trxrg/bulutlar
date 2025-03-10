import React, { useState, useContext, useEffect } from 'react';
import { format } from 'date-fns';

import GeneralModal from '../../common/GeneralModal.jsx';
import { AppContext } from '../../../store/app-context.jsx';
import { articleApi } from '../../../backend-adapter/BackendAdapter.js';
import ActionButton from '../../common/ActionButton.jsx';
import CategoryList from '../../category/CategoryList.jsx';
import OwnerList from '../../owner/OwnerList.jsx';
import TagList from '../../tag/TagList.jsx';
import DateInput from '../../common/DateInput.jsx';
import toastr from 'toastr';

const AddArticleModal = ({ isOpen, onRequestClose }) => {
    const { translate: t, afterSubmitArticle2 } = useContext(AppContext);

    const [dispTitle, setDispTitle] = useState('');
    const [dispDate, setDispDate] = useState('');
    const [dispOwnerName, setDispOwnerName] = useState('')
    const [dispCategoryName, setDispCategoryName] = useState('');
    const [dispTags, setDispTags] = useState([]);
    const [msg, setMsg] = useState('');

    const handleTagsChange = (tags) => {
        setDispTags(tags);
    }

    useEffect(() => {
        setDispCategoryName('');
        setDispOwnerName('');
        setDispTags([]);
        setDispTitle(t('new article'));
        setMsg('');
        setDispDate(format(new Date(), 'yyyy-MM-dd'))
    }, [isOpen]);

    useEffect(() => {
        setMsg('')
    }, [dispCategoryName, dispDate, dispOwnerName, dispTags, dispTitle]);

    const handleSubmit = async () => {

        if (!dispTitle || dispTitle.trim() === '') {
            setMsg(t('title') + t('cannot be empty'));
            return;
        }

        if (!dispCategoryName || dispCategoryName.trim() === '') {
            setMsg(t('category') + t('cannot be empty'));
            return;
        }

        if (!dispDate || dispDate.trim() === '') {
            setMsg(t('date') + t('cannot be empty'));
            return;
        }

        try {
            const result = await articleApi.create({
                title: dispTitle,
                date: dispDate,
                owner: { name: dispOwnerName },
                category: { name: dispCategoryName },
                tags: dispTags,
            });
            if (result.error) {
                console.error(result.error);
                toastr.error(result.error.message || t('error'));
            } else {
                console.log('article added:');
                console.log(result);
                toastr.success(t('article') + t('added'));
                afterSubmitArticle2(result.id);
            }
        } catch (err) {
            console.error(err.message);
            toastr.error(err.message || t('error'));
        } finally {
            onRequestClose();
        }
    };

    return (
        <GeneralModal isOpen={isOpen} onRequestClose={onRequestClose} title={t('add article')}>

            <div className='flex flex-col gap-2 h-full'>
                {msg && <span className="text-red-400">{msg}</span>}
                <div>
                    <label className="block text-gray-700 font-bold mb-2" htmlFor="title">{t('title') + '*'}</label>
                    <input
                        id="title"
                        type="text"
                        value={dispTitle}
                        onChange={(e) => setDispTitle(e.target.value.trimStart())}
                        required
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                </div>
                <div className='flex gap-2 min-w-full'>
                    <div className='flex flex-col flex-1'>
                        <label className="block text-gray-700 font-bold mb-2">{t('category') + '*'}</label>
                        <CategoryList onCategoryChange={setDispCategoryName}></CategoryList>
                    </div>
                    <div>
                        <div className="border h-full border-gray-700 mx-2"></div>
                    </div>
                    <div>
                        <label className="block text-gray-700 font-bold mb-2">{t('date') + '*'}</label>
                        <DateInput dispDate={dispDate} onDateChange={setDispDate}></DateInput>
                    </div>
                </div>
                <div className='flex flex-col flex-1'>
                    <label className="block text-gray-700 font-bold mb-2">{t('owner')}</label>
                    <OwnerList onOwnerChange={setDispOwnerName}></OwnerList>
                </div>
                {/* <div>
                    <label className="block text-gray-700 font-bold mb-2">{t('tag')}</label>
                    <TagList selectedTags={dispTags} onTagsChange={handleTagsChange}></TagList>
                </div> */}
                <div className='flex justify-end gap-2 mt-4'>
                    <ActionButton color={'red'} onClick={onRequestClose}>{t('cancel')}</ActionButton>
                    <ActionButton color={'blue'} onClick={handleSubmit}>{t('add')}</ActionButton>
                </div>
            </div>
        </GeneralModal>
    );
};



export default AddArticleModal;