import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { articleApi, youtubeApi } from '../backend-adapter/BackendAdapter.js';
import { AppContext } from './app-context.jsx';
import { getYoutubeErrorPayload, resolveYoutubeErrorMessage } from '../utils/youtubeErrorMessages.js';
import toastr from 'toastr';

export const YoutubeDownloadContext = createContext(null);

function createJobId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `yt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useYoutubeDownload() {
    const ctx = useContext(YoutubeDownloadContext);
    if (!ctx) {
        throw new Error('useYoutubeDownload must be used within YoutubeDownloadContextProvider');
    }
    return ctx;
}

export default function YoutubeDownloadContextProvider({ children }) {
    const { translate: t, setActiveScreen, addTab } = useContext(AppContext);
    const [jobs, setJobs] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalArticleId, setModalArticleId] = useState(null);
    const [modalEditorField, setModalEditorField] = useState('mainText');
    const [activeJobId, setActiveJobId] = useState(null);
    const articleVideoHandlers = useRef(new Map());
    const cancelledJobIds = useRef(new Set());
    const activeJobIdRef = useRef(null);
    const isModalOpenRef = useRef(false);

    useEffect(() => {
        activeJobIdRef.current = activeJobId;
    }, [activeJobId]);

    useEffect(() => {
        isModalOpenRef.current = isModalOpen;
    }, [isModalOpen]);

    const updateJob = useCallback((jobId, patch) => {
        setJobs((prev) => prev.map((job) => (job.id === jobId ? { ...job, ...patch } : job)));
    }, []);

    const removeJobLater = useCallback((jobId, delayMs = 12000) => {
        window.setTimeout(() => {
            setJobs((prev) => prev.filter((job) => job.id !== jobId));
        }, delayMs);
    }, []);

    const registerArticleVideoHandler = useCallback((articleId, handler) => {
        articleVideoHandlers.current.set(articleId, handler);
    }, []);

    const unregisterArticleVideoHandler = useCallback((articleId) => {
        articleVideoHandlers.current.delete(articleId);
    }, []);

    const injectVideoToArticle = useCallback((articleId, videoEntity, editorField) => {
        const handler = articleVideoHandlers.current.get(articleId);
        if (handler) handler(videoEntity, editorField);
    }, []);

    const openModal = useCallback(({ articleId, editorField = 'mainText', jobId = null }) => {
        setModalArticleId(articleId);
        setModalEditorField(editorField);
        setActiveJobId(jobId);
        setIsModalOpen(true);
    }, []);

    const hideModal = useCallback(() => {
        setIsModalOpen(false);
    }, []);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setActiveJobId(null);
    }, []);

    const reopenModal = useCallback((jobId) => {
        const job = jobs.find((j) => j.id === jobId);
        if (!job) return;
        openModal({
            articleId: job.articleId,
            editorField: job.editorField,
            jobId: job.id,
        });
    }, [jobs, openModal]);

    const openArticleForJob = useCallback((jobId) => {
        const job = jobs.find((j) => j.id === jobId);
        if (!job?.articleId) return;
        setActiveScreen('tabs');
        addTab(null, job.articleId);
    }, [addTab, jobs, setActiveScreen]);

    const handleFooterChipClick = useCallback((jobId) => {
        const job = jobs.find((j) => j.id === jobId);
        if (!job) return;

        if (job.status === 'completed') {
            openArticleForJob(jobId);
            return;
        }

        reopenModal(jobId);
    }, [jobs, openArticleForJob, reopenModal]);

    const dismissJob = useCallback((jobId) => {
        setJobs((prev) => prev.filter((job) => job.id !== jobId));
        if (activeJobId === jobId) {
            setActiveJobId(null);
        }
    }, [activeJobId]);

    const cancelDownload = useCallback(async (jobId) => {
        const job = jobs.find((j) => j.id === jobId);
        if (!job || job.status !== 'downloading') return;

        cancelledJobIds.current.add(jobId);
        updateJob(jobId, { status: 'cancelling' });

        try {
            await youtubeApi.cancelDownload(jobId);
        } catch (error) {
            console.error('Failed to cancel YouTube download:', error);
        }

        dismissJob(jobId);
        if (activeJobId === jobId) {
            closeModal();
        }
    }, [activeJobId, closeModal, dismissJob, jobs, updateJob]);

    const runDownloadJob = useCallback(async (job) => {
        try {
            const videoEntity = await youtubeApi.download(
                job.id,
                job.articleId,
                job.url,
                job.formatId,
                job.meta,
            );

            if (cancelledJobIds.current.has(job.id)) {
                cancelledJobIds.current.delete(job.id);
                return;
            }

            await articleApi.appendVideoNode(job.articleId, videoEntity.id, job.editorField);
            injectVideoToArticle(job.articleId, videoEntity, job.editorField);

            updateJob(job.id, {
                status: 'completed',
                progress: 100,
                videoEntity,
                title: videoEntity.description || videoEntity.name || job.title,
            });

            toastr.success(t('youtube download complete', {
                title: videoEntity.description || videoEntity.name || job.title,
            }));

            if (activeJobIdRef.current === job.id && isModalOpenRef.current) {
                hideModal();
                setActiveJobId(null);
            }
        } catch (error) {
            if (cancelledJobIds.current.has(job.id)) {
                cancelledJobIds.current.delete(job.id);
                return;
            }

            const payload = getYoutubeErrorPayload(error);
            if (payload?.code === 'DOWNLOAD_CANCELLED') {
                dismissJob(job.id);
                return;
            }

            console.error('YouTube download failed:', error);
            const message = resolveYoutubeErrorMessage(error, t);
            updateJob(job.id, { status: 'error', error: message });
            toastr.error(t('youtube download failed', { message }));
            removeJobLater(job.id, 12000);
        }
    }, [dismissJob, hideModal, injectVideoToArticle, removeJobLater, t, updateJob]);

    const startDownload = useCallback(({
        articleId,
        editorField,
        url,
        title,
        formatId,
        meta,
    }) => {
        const job = {
            id: createJobId(),
            articleId,
            editorField,
            url,
            title: title || 'YouTube Video',
            formatId,
            meta,
            progress: 0,
            status: 'downloading',
        };

        setJobs((prev) => [...prev, job]);
        setActiveJobId(job.id);
        runDownloadJob(job);
        return job.id;
    }, [runDownloadJob]);

    useEffect(() => {
        const dispose = youtubeApi.onDownloadProgress((progress) => {
            if (!progress?.jobId || progress.percent == null) return;
            setJobs((prev) => prev.map((job) => (
                job.id === progress.jobId && job.status === 'downloading'
                    ? { ...job, progress: progress.percent }
                    : job
            )));
        });
        return dispose;
    }, []);

    const activeJob = activeJobId ? jobs.find((j) => j.id === activeJobId) : null;
    const visibleJobs = jobs.filter((j) => (
        j.status === 'downloading' || j.status === 'cancelling' || j.status === 'completed' || j.status === 'error'
    ));

    const value = {
        jobs,
        visibleJobs,
        isModalOpen,
        modalArticleId,
        modalEditorField,
        activeJobId,
        activeJob,
        openModal,
        hideModal,
        closeModal,
        reopenModal,
        handleFooterChipClick,
        openArticleForJob,
        startDownload,
        cancelDownload,
        dismissJob,
        registerArticleVideoHandler,
        unregisterArticleVideoHandler,
        injectVideoToArticle,
    };

    return (
        <YoutubeDownloadContext.Provider value={value}>
            {children}
        </YoutubeDownloadContext.Provider>
    );
}
