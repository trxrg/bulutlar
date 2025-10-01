import React, { useState, useContext, useEffect } from 'react';
import { format } from 'date-fns';

import GeneralModal from '../../common/GeneralModal.jsx';
import { AppContext } from '../../../store/app-context.jsx';
import { articleApi, urlApi } from '../../../backend-adapter/BackendAdapter.js';
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
    const [urlInput, setUrlInput] = useState('');
    const [isFetching, setIsFetching] = useState(false);
    const [fetchMode, setFetchMode] = useState('manual'); // 'manual' or 'url'
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
        setFetchMode('manual');
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
                    
                    if (data.author) {
                        setDispOwnerName(data.author);
                    }
                } else {
                    // For articles, use the actual title and store the content
                    setDispTitle(data.title || t('fetched article'));
                    setFetchedContent(data.content || '');
                    
                    if (data.author) {
                        setDispOwnerName(data.author);
                    }
                }
                
                // Show warning if no content was fetched
                if (isTwitterUrl && !data.formattedContent && !data.tweetText) {
                    toastr.warning(t('no tweet content found at this url'));
                } else if (!isTwitterUrl && !data.content) {
                    toastr.warning(t('no article content found at this url'));
                }
                
                // Try to parse date if available
                if (data.publishedDate || data.timestamp) {
                    try {
                        const dateStr = data.publishedDate || data.timestamp;
                        const date = new Date(dateStr);
                        if (!isNaN(date.getTime())) {
                            setDispDate(format(date, 'yyyy-MM-dd'));
                        }
                    } catch (e) {
                        console.log('Could not parse date:', e);
                    }
                }

                // Add URL as a tag
                const urlTag = { name: 'URL' };
                setDispTags(prev => [...prev, urlTag]);

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
                date: dispDate,
                owner: { name: dispOwnerName },
                category: { name: dispCategoryName },
                tags: dispTags,
                text: fetchedContent ? `<p>${fetchedContent.replace(/\n/g, '</p><p>')}</p>` : undefined,
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
                {msg && <span style={{ color: '#dc2626' }}>{msg}</span>}
                
                {/* Tab Navigation */}
                <div className="border-b border-gray-300 mb-4">
                    <nav className="flex space-x-8">
                        <button
                            onClick={() => setFetchMode('manual')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                fetchMode === 'manual' 
                                    ? 'border-blue-500 text-blue-600' 
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                            style={{
                                color: fetchMode === 'manual' ? 'var(--accent-color)' : 'var(--text-secondary)',
                                borderBottomColor: fetchMode === 'manual' ? 'var(--accent-color)' : 'transparent'
                            }}
                        >
                            {t('Manual Entry')}
                        </button>
                        <button
                            onClick={() => setFetchMode('url')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                fetchMode === 'url' 
                                    ? 'border-blue-500 text-blue-600' 
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                            style={{
                                color: fetchMode === 'url' ? 'var(--accent-color)' : 'var(--text-secondary)',
                                borderBottomColor: fetchMode === 'url' ? 'var(--accent-color)' : 'transparent'
                            }}
                        >
                            {t('Fetch From Url')}
                        </button>
                    </nav>
                </div>

                {/* Tab Content */}

                {fetchMode === 'url' && (
                    <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)' }}>
                        <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                {t('fetch from url')}
                            </span>
                        </div>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="url"
                                placeholder={t('enter url (article, tweet, etc.)')}
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
                                color={'green'} 
                                onClick={handleUrlFetch}
                                disabled={isFetching}
                            >
                                {isFetching ? t('fetching...') : t('fetch')}
                            </ActionButton>
                        </div>
                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {t('supports articles, tweets, and other web content')}
                        </div>
                    </div>
                )}
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
                    {fetchedContent && (
                        <div className="mt-1 text-sm text-green-600">
                            ✓ {t('content will be included in article')}
                        </div>
                    )}
                </div>
                <div className='flex gap-2 min-w-full'>
                    <div className='flex flex-col flex-1'>
                        <label className="block font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{t('category') + '*'}</label>
                        <CategoryList onCategoryChange={setDispCategoryName}></CategoryList>
                    </div>
                    <div>
                        <div 
                            className="h-full mx-2" 
                            style={{ 
                                border: '1px solid var(--border-secondary)' 
                            }}
                        ></div>
                    </div>
                    <div>
                        <label className="block font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{t('date') + '*'}</label>
                        <DateInput dispDate={dispDate} onDateChange={setDispDate}></DateInput>
                    </div>
                </div>
                <div className='flex flex-col flex-1'>
                    <label className="block font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{t('owner')}</label>
                    <OwnerList onOwnerChange={setDispOwnerName}></OwnerList>
                </div>
                {/* <div>
                    <label className="block font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{t('tag')}</label>
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