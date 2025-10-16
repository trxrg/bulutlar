import React, { useState, useContext, useEffect } from 'react';
import { format } from 'date-fns';

import GeneralModal from '../../common/GeneralModal.jsx';
import { AppContext } from '../../../store/app-context.jsx';
import { articleApi, urlApi } from '../../../backend-adapter/BackendAdapter.js';
import ActionButton from '../../common/ActionButton.jsx';
import CategoryList from '../../category/CategoryList.jsx';
import OwnerList from '../../owner/OwnerList.jsx';
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
    const [urlInput, setUrlInput] = useState('');
    const [isFetching, setIsFetching] = useState(false);
    const [fetchedContent, setFetchedContent] = useState('');

    const handleTagsChange = (tags) => {
        setDispTags(tags);
    }

    useEffect(() => {
        setDispCategoryName('');
        setDispOwnerName('');
        setDispTags([]);
        setDispTitle(t('new article'));
        setMsg('');
        setDispDate(format(new Date(), 'yyyy-MM-dd'));
        setUrlInput('');
        setIsFetching(false);
        setFetchedContent('');
    }, [isOpen]);

    useEffect(() => {
        setMsg('')
    }, [dispCategoryName, dispDate, dispOwnerName, dispTags, dispTitle]);

    const handleUrlFetch = async () => {
        if (!urlInput.trim()) {
            setMsg(t('please enter a valid url'));
            return;
        }

        setIsFetching(true);
        setMsg('');

        try {
            // Check if it's a Twitter/X URL
            const isTwitterUrl = urlInput.includes('twitter.com') || urlInput.includes('x.com');

            let result;
            if (isTwitterUrl) {
                result = await urlApi.fetchTweet(urlInput);
            } else {
                result = await urlApi.fetchContent(urlInput);
            }

            if (result.success) {
                const data = result.data;

                // Handle tweets differently from articles
                if (isTwitterUrl) {
                    // For tweets, create a proper title and store the formatted tweet content
                    const tweetTitle = data.author ? `${data.author}: Tweet` : 'Tweet';
                    setDispTitle(tweetTitle);
                    setFetchedContent(data.formattedContent || data.tweetText || '');
                } else {
                    // For articles, use the actual title and store the content
                    setDispTitle(data.title || t('fetched article'));
                    setFetchedContent(data.content || '');
                }

                // Show warning if no content was fetched
                if (isTwitterUrl && !data.formattedContent && !data.tweetText) {
                    toastr.warning(t('no tweet content found at this url'));
                } else if (!isTwitterUrl && !data.content) {
                    toastr.warning(t('no article content found at this url'));
                }


                toastr.success(t('content fetched successfully'));
            } else {
                setMsg(result.error || t('failed to fetch content'));
                toastr.error(result.error || t('failed to fetch content'));
            }
        } catch (error) {
            console.error('Error fetching URL:', error);
            setMsg(error.message || t('error fetching content'));
            toastr.error(error.message || t('error fetching content'));
        } finally {
            setIsFetching(false);
        }
    };

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
                date: (() => {
                    // Combine the date from dispDate with the current time (HH:mm:ss)
                    if (!dispDate) return '';
                    const now = new Date();
                    const pad = (n) => n.toString().padStart(2, '0');
                    const currentTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
                    
                    return `${dispDate}T${currentTime}`;
                })(),
                owner: { name: dispOwnerName },
                category: { name: dispCategoryName },
                tags: dispTags,
                text: fetchedContent ? `<p>${fetchedContent.replace(/\n/g, '</p><p>')}</p>` : undefined,
            });
            if (result.error) {
                console.error(result.error);
                toastr.error(result.error.message || t('error'));
            } else {
                console.log('article added');
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
        <GeneralModal isOpen={isOpen} onRequestClose={onRequestClose} title={t('add article')} style={{ width: '80%', height: '80%' }}>

            <div className='flex flex-col h-full'>
                <div className='flex-1'>
                    {msg && <span style={{ color: '#dc2626' }}>{msg}</span>}

                    {/* Form Fields */}
                    <div className="space-y-6">
                    {/* Title Field */}
                    <div>
                        <label className="block font-bold mb-2" style={{ color: 'var(--text-primary)' }} htmlFor="title">{t('title') + '*'}</label>
                        <input
                            id="title"
                            type="text"
                            value={dispTitle}
                            onChange={(e) => setDispTitle(e.target.value.trimStart())}
                            required
                            className="appearance-none rounded w-full py-2 px-3 leading-tight focus:outline-none"
                            style={{
                                backgroundColor: 'var(--bg-primary)',
                                border: '1px solid var(--border-secondary)',
                                color: 'var(--text-primary)',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                            }}
                        />
                    </div>

                    {/* Category and Date Row */}
                    <div className='flex w-full gap-6'>
                        <div className='flex-1'>
                            <label className="block font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{t('category') + '*'}</label>
                            <CategoryList onCategoryChange={setDispCategoryName}></CategoryList>
                        </div>
                        <div className="flex items-center justify-center">
                            <div className="h-16 w-px" style={{ backgroundColor: 'var(--border-secondary)' }}></div>
                        </div>
                        <div className='flex-shrink-0'>
                            <label className="block font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{t('date') + '*'}</label>
                            <DateInput dispDate={dispDate} onDateChange={setDispDate}></DateInput>
                        </div>
                    </div>

                    {/* Owner Field */}
                    <div>
                        <label className="block font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{t('owner')}</label>
                        <OwnerList onOwnerChange={setDispOwnerName}></OwnerList>
                    </div>

                    {/* URL Input - Optional */}
                    <div>
                        <label className="block font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{t('url (optional)')}</label>
                        <div className="flex gap-2">
                            <input
                                type="url"
                                placeholder={t('enter url to fetch content')}
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                className="flex-1 py-2 px-3 rounded border"
                                style={{
                                    backgroundColor: 'var(--bg-primary)',
                                    border: '1px solid var(--border-secondary)',
                                    color: 'var(--text-primary)',
                                }}
                                disabled={isFetching}
                            />
                            <ActionButton
                                onClick={handleUrlFetch}
                                disabled={isFetching}
                            >
                                {isFetching ? t('fetching...') : t('fetch')}
                            </ActionButton>
                        </div>
                        {fetchedContent && (
                            <div className="mt-2 text-sm text-green-600">
                                ✓ {t('content will be included in article')}
                            </div>
                        )}
                    </div>
                    </div>
                </div>
                
                {/* Buttons at bottom */}
                <div className='flex justify-end gap-2 mt-4 flex-shrink-0'>
                    <ActionButton color={'red'} onClick={onRequestClose}>{t('cancel')}</ActionButton>
                    <ActionButton color={'blue'} onClick={handleSubmit} disabled={isFetching}>{t('add')}</ActionButton>
                </div>
            </div>
        </GeneralModal>
    );
};



export default AddArticleModal;