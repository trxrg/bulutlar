import React, { useState, useContext, useEffect } from 'react';
import { format } from 'date-fns';

import GeneralModal from '../common/GeneralModal';
import { AppContext } from '../../store/app-context';
import { articleApi } from '../../backend-adapter/BackendAdapter.js';
import ActionButton from '../common/ActionButton';
import CategoryList from '../category/CategoryList';
import OwnerList from '../owner/OwnerList';
import TagList from '../tag/TagList';
import DateInput from '../common/DateInput';

const AddArticleModal = ({ isOpen, onRequestClose }) => {
    const { translate: t } = useContext(AppContext);

    const [dispTitle, setDispTitle] = useState('');
    const [dispDate, setDispDate] = useState('');
    const [dispOwnerName, setDispOwnerName] = useState('')
    const [dispCategoryName, setDispCategoryName] = useState('');
    const [dispTags, setDispTags] = useState([]);
    const [hasOwner, setHasOwner] = useState(false);

    const handleTagsChange = (tags) => {
        setDispTags(tags);
    }

    useEffect(() => {
        setDispDate(format(new Date(), 'yyyy-MM-dd'))
    }, [isOpen]);

    const handleSubmit = async () => {        
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
            } else {
                console.log('article added:');
                console.log(result);
            }

            // afterSubmitArticle(result.id);
        } catch (err) {
            console.error(err.message);
        }
    };

    return (
        <GeneralModal isOpen={isOpen} onRequestClose={onRequestClose} title={t('add article')}>

            <div className='flex flex-col gap-2'>
                <div>
                    <label className="block text-gray-700 font-bold mb-2" htmlFor="title">{t('title')}</label>
                    <input
                        id="title"
                        type="text"
                        value={dispTitle}
                        onChange={(e) => setDispTitle(e.target.value)}
                        required
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                </div>
                <div>
                    <label className="block text-gray-700 font-bold mb-2">{t('category')}</label>
                    <CategoryList onCategoryChange={setDispCategoryName}></CategoryList>
                </div>
                <div>
                    <label className="block text-gray-700 font-bold mb-2">{t('tag')}</label>
                    <TagList selectedTags={dispTags} onTagsChange={handleTagsChange}></TagList>
                </div>
                <div>
                    <label className="block text-gray-700 font-bold mb-2">{t('date')}</label>
                    <DateInput dispDate={dispDate} onDateChange={setDispDate}></DateInput>
                </div>
                <div>
                    <label className="block text-gray-700 font-bold mb-2">
                        <input
                            type="checkbox"
                            checked={hasOwner}
                            onChange={(e) => setHasOwner(e.target.checked)}
                            className="mr-2 leading-tight"
                        />
                        {t('relate to a person')}
                    </label>

                    {hasOwner &&
                        <div>
                            <label className="block text-gray-700 font-bold mb-2" htmlFor="explanation">{t('owner')}</label>
                            <OwnerList onOwnerChange={setDispOwnerName}></OwnerList>
                        </div>}
                </div>
                <div className='flex justify-end gap-2 mt-4'>
                    <ActionButton color={'blue'} onClick={handleSubmit}>{t('add')}</ActionButton>
                    <ActionButton color={'red'} onClick={onRequestClose}>{t('cancel')}</ActionButton>
                </div>
            </div>
        </GeneralModal>
    );
};



export default AddArticleModal;