import React, { useContext, useEffect, useState } from 'react';
import GeneralModal from '../../../common/GeneralModal.jsx';
import ActionButton from '../../../common/ActionButton.jsx';
import { articleApi, youtubeApi } from '../../../../backend-adapter/BackendAdapter.js';
import { AppContext } from '../../../../store/app-context.jsx';
import { useYoutubeDownload } from '../../../../store/youtube-download-context.jsx';
import { extractYoutubeVideoId, normalizeYoutubeUrl } from '../../../../utils/extractYoutubeVideoId.js';
import { resolveYoutubeErrorMessage } from '../../../../utils/youtubeErrorMessages.js';
import toastr from 'toastr';

const YoutubeVideoModal = () => {
    const { translate: t } = useContext(AppContext);
    const {
        isModalOpen,
        modalArticleId,
        modalEditorField,
        activeJob,
        hideModal,
        closeModal,
        startDownload,
        cancelDownload,
        injectVideoToArticle,
    } = useYoutubeDownload();

    const [url, setUrl] = useState('');
    const [info, setInfo] = useState(null);
    const [mode, setMode] = useState('download');
    const [selectedFormatId, setSelectedFormatId] = useState('');
    const [isFetching, setIsFetching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [binariesWarning, setBinariesWarning] = useState('');
    const [ytDlpMissing, setYtDlpMissing] = useState(false);
    const [ffmpegMissing, setFfmpegMissing] = useState(false);

    const isViewingActiveJob = activeJob && (
        activeJob.status === 'downloading'
        || activeJob.status === 'cancelling'
        || activeJob.status === 'error'
    );
    const downloadProgress = activeJob?.progress ?? 0;

    useEffect(() => {
        if (!isModalOpen) {
            setUrl('');
            setInfo(null);
            setMode('download');
            setSelectedFormatId('');
            setIsFetching(false);
            setIsSubmitting(false);
            setErrorMessage('');
            setBinariesWarning('');
            setYtDlpMissing(false);
            setFfmpegMissing(false);
            return;
        }

        if (activeJob?.url) {
            setUrl(activeJob.url);
            setMode('download');
        }

        let cancelled = false;
        (async () => {
            try {
                const status = await youtubeApi.checkBinaries();
                if (cancelled) return;

                const warnings = [];
                const missingYtDlp = !status?.ytDlp?.ok;
                const missingFfmpeg = !status?.ffmpeg?.ok;

                setYtDlpMissing(missingYtDlp);
                setFfmpegMissing(missingFfmpeg);
                if (missingYtDlp) warnings.push(t('youtubeErrorYtDlpMissing'));
                if (missingFfmpeg) warnings.push(t('youtubeErrorFfmpegMissing'));

                setBinariesWarning(warnings.join(' '));
            } catch (error) {
                if (!cancelled) {
                    setBinariesWarning(resolveYoutubeErrorMessage(error, t));
                }
            }
        })();

        return () => { cancelled = true; };
    }, [isModalOpen, activeJob?.url, t]);

    const handleFetch = async () => {
        if (!url.trim()) return;
        const normalizedUrl = normalizeYoutubeUrl(url.trim());
        if (!extractYoutubeVideoId(normalizedUrl)) {
            setErrorMessage(t('youtubeErrorInvalidUrl'));
            return;
        }

        setUrl(normalizedUrl);
        setIsFetching(true);
        setInfo(null);
        setErrorMessage('');
        try {
            const result = await youtubeApi.getInfo(normalizedUrl);
            setInfo(result);
            setSelectedFormatId(result.defaultFormatId || result.formats[0]?.formatId || '');
        } catch (error) {
            console.error('Error fetching YouTube info:', error);
            setErrorMessage(resolveYoutubeErrorMessage(error, t));
        } finally {
            setIsFetching(false);
        }
    };

    const handleEmbed = async () => {
        if (!modalArticleId || !url.trim()) return;
        const normalizedUrl = normalizeYoutubeUrl(url.trim());
        const videoId = extractYoutubeVideoId(normalizedUrl);
        if (!videoId) {
            setErrorMessage(t('youtubeErrorInvalidUrl'));
            return;
        }

        setUrl(normalizedUrl);
        setIsSubmitting(true);
        setErrorMessage('');
        try {
            const videoEntity = await articleApi.addYoutubeEmbed(modalArticleId, {
                url: normalizedUrl,
                videoId,
                title: t('YouTube Video'),
            });
            injectVideoToArticle(modalArticleId, videoEntity, modalEditorField);
            closeModal();
            toastr.success(t('videoAdded'));
        } catch (error) {
            console.error('Error embedding YouTube video:', error);
            setErrorMessage(resolveYoutubeErrorMessage(error, t));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStartDownload = () => {
        if (!info || !modalArticleId || !selectedFormatId) return;
        const selectedFormat = info.formats.find((format) => format.formatId === selectedFormatId);
        startDownload({
            articleId: modalArticleId,
            editorField: modalEditorField,
            url: info.url || normalizeYoutubeUrl(url.trim()),
            title: info.title,
            formatId: selectedFormatId,
            meta: {
                title: info.title,
                duration: info.duration,
                hasAudio: selectedFormat?.hasAudio ?? true,
                ext: selectedFormat?.ext || 'mp4',
                quality: selectedFormat?.quality || 0,
            },
        });
    };

    const handleRequestClose = () => {
        if (isViewingActiveJob) {
            hideModal();
            return;
        }
        closeModal();
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${String(secs).padStart(2, '0')}`;
    };

    return (
        <GeneralModal
            isOpen={isModalOpen}
            onRequestClose={handleRequestClose}
            title={t('add from youtube')}
            style={{ maxHeight: '80%', minWidth: '40%' }}
        >
            <div className="flex flex-col gap-4">
                {binariesWarning && mode === 'download' && (
                    <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                        {binariesWarning}
                        {!ytDlpMissing && ffmpegMissing && (
                            <p className="mt-1 text-amber-800">{t('youtubeEmbedStillWorks')}</p>
                        )}
                    </div>
                )}

                {errorMessage && (
                    <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
                        {errorMessage}
                    </div>
                )}

                {isViewingActiveJob ? (
                    <div className="flex flex-col gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-700">{activeJob.title}</h3>
                            {activeJob.status === 'error' && (
                                <p className="text-sm text-red-700 mt-2">{activeJob.error}</p>
                            )}
                        </div>

                        {activeJob.status === 'downloading' && (
                            <div className="flex flex-col gap-1">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-green-500 h-2 rounded-full transition-all"
                                        style={{ width: `${Math.min(downloadProgress, 100)}%` }}
                                    />
                                </div>
                                <p className="text-sm text-gray-500 text-right">{Math.round(downloadProgress)}%</p>
                            </div>
                        )}

                        <div className="flex justify-end gap-2">
                            {activeJob.status === 'downloading' && (
                                <>
                                    <ActionButton onClick={() => cancelDownload(activeJob.id)} color="red">
                                        {t('cancel download')}
                                    </ActionButton>
                                    <ActionButton onClick={hideModal}>{t('download in background')}</ActionButton>
                                </>
                            )}
                            {activeJob.status === 'cancelling' && (
                                <p className="text-sm text-gray-500 mr-auto">{t('cancelling download')}</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        <fieldset className="flex gap-2 border-0 p-0 m-0">
                            <legend className="sr-only">{t('youtube add mode')}</legend>
                            {[
                                { value: 'download', label: t('download') },
                                { value: 'embed', label: t('embed') },
                            ].map((opt) => {
                                const selected = mode === opt.value;
                                return (
                                    <label
                                        key={opt.value}
                                        className="flex items-center gap-2 cursor-pointer rounded-lg px-4 py-2 transition-all"
                                        style={{
                                            border: `1px solid ${selected ? 'var(--border-primary)' : 'var(--border-secondary)'}`,
                                            backgroundColor: selected ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                                            boxShadow: selected ? '0 0 0 1px var(--border-primary)' : 'none',
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="youtube-add-mode"
                                            value={opt.value}
                                            checked={selected}
                                            onChange={() => {
                                                setMode(opt.value);
                                                setErrorMessage('');
                                                if (opt.value === 'embed') setInfo(null);
                                            }}
                                        />
                                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                            {opt.label}
                                        </span>
                                    </label>
                                );
                            })}
                        </fieldset>

                        <div className="flex gap-2">
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => {
                                    setUrl(e.target.value);
                                    if (errorMessage) setErrorMessage('');
                                }}
                                placeholder={t('paste youtube url')}
                                className="flex-1 border rounded-lg px-3 py-2 text-gray-700"
                                onKeyDown={(e) => {
                                    if (e.key !== 'Enter') return;
                                    if (mode === 'embed') handleEmbed();
                                    else handleFetch();
                                }}
                            />
                            {mode === 'download' && (
                                <ActionButton onClick={handleFetch} disabled={isFetching || !url.trim()}>
                                    {isFetching ? t('fetching youtube video info') : t('fetch')}
                                </ActionButton>
                            )}
                        </div>

                        {mode === 'embed' && (
                            <>
                                <p className="text-sm text-gray-500">{t('youtube embed description')}</p>
                                <div className="flex justify-end gap-2">
                                    <ActionButton onClick={handleRequestClose}>{t('cancel')}</ActionButton>
                                    <ActionButton
                                        onClick={handleEmbed}
                                        color="green"
                                        disabled={isSubmitting || !url.trim()}
                                    >
                                        {isSubmitting ? `${t('loading')}...` : t('add video')}
                                    </ActionButton>
                                </div>
                            </>
                        )}

                        {mode === 'download' && info && (
                            <div className="flex flex-col gap-4">
                                <div className="flex gap-4 items-start">
                                    {info.thumbnail && (
                                        <img src={info.thumbnail} alt={info.title} className="w-40 rounded-lg" />
                                    )}
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-700">{info.title}</h3>
                                        {info.duration && (
                                            <p className="text-sm text-gray-500 mt-1">{formatDuration(info.duration)}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-gray-600">{t('quality and format')}</label>
                                    <select
                                        value={selectedFormatId}
                                        onChange={(e) => setSelectedFormatId(e.target.value)}
                                        className="border rounded-lg px-3 py-2 text-gray-700"
                                    >
                                        {info.formats.map((format) => (
                                            <option key={format.formatId} value={format.formatId}>
                                                {format.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex justify-end gap-2">
                                    <ActionButton onClick={handleRequestClose}>{t('cancel')}</ActionButton>
                                    <ActionButton
                                        onClick={handleStartDownload}
                                        color="green"
                                        disabled={!selectedFormatId || !info.formats?.length || ytDlpMissing}
                                    >
                                        {t('start download')}
                                    </ActionButton>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </GeneralModal>
    );
};

export default YoutubeVideoModal;
