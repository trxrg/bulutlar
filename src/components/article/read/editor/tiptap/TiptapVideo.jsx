import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { videoApi } from '../../../../../backend-adapter/BackendAdapter';
import { AppContext } from '../../../../../store/app-context';
import { ReadContext } from '../../../../../store/read-context';
import ContextMenu from '../../../../common/ContextMenu';
import ActionButton from '../../../../common/ActionButton';
import ConfirmModal from '../../../../common/ConfirmModal';
import { MediaMetadataExtractor } from '../../../../../utils/MediaMetadataExtractor';
import { extractYoutubeVideoId } from '../../../../../utils/extractYoutubeVideoId';
import toastr from 'toastr';

const TiptapVideo = ({ node, deleteNode, extension }) => {
    const videoEntity = node.attrs;
    const isYoutubeEmbed = videoEntity.sourceType === 'youtube' && !videoEntity.path;

    const [videoData, setVideoData] = useState(null);
    const [videoMetadata, setVideoMetadata] = useState(null);
    const [contextMenuIsOpen, setContextMenuIsOpen] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 10, y: 10 });
    const [deleteConfirmModalIsOpen, setDeleteConfirmModalIsOpen] = useState(false);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);

    const { translate: t } = useContext(AppContext);
    const { editable } = useContext(ReadContext);
    const videoRef = useRef(null);

    const youtubeVideoId = useMemo(() => {
        if (!isYoutubeEmbed) return null;
        return extractYoutubeVideoId(videoEntity.sourceUrl) || videoEntity.field1 || null;
    }, [isYoutubeEmbed, videoEntity.sourceUrl, videoEntity.field1]);

    const youtubeEmbedUrl = useMemo(() => {
        if (!youtubeVideoId) return null;
        return `https://www.youtube.com/embed/${youtubeVideoId}`;
    }, [youtubeVideoId]);

    const videoUrl = useMemo(() => {
        if (!videoData || isYoutubeEmbed) return null;
        const platform = window.versions?.platform() || 'unknown';
        if (platform === 'win32') {
            const normalizedPath = videoData.replace(/\\/g, '/');
            if (normalizedPath.match(/^[a-zA-Z]:\//)) {
                const driveLetter = normalizedPath[0].toLowerCase();
                const pathWithoutDrive = normalizedPath.substring(2);
                return `media-file://${driveLetter}${pathWithoutDrive}`;
            }
            return `media-file:///${normalizedPath}`;
        }
        return `media-file://${videoData}`;
    }, [videoData, isYoutubeEmbed]);

    const fetchVideoData = async () => {
        if (isYoutubeEmbed) return;
        try {
            const result = await videoApi.getDataById(videoEntity.id);
            if (typeof result === 'string') {
                setVideoData(result);
                setVideoMetadata(null);
            } else {
                setVideoData(result.path);
                setVideoMetadata(result.metadata);
            }
        } catch (error) {
            console.error('Error fetching video data:', error);
        }
    };

    const extractAndUpdateMetadata = async (currentMetadata) => {
        try {
            const extractedMetadata = await MediaMetadataExtractor.extractVideoMetadata(videoUrl);
            await videoApi.updateMetadata(videoEntity.id, extractedMetadata);
            setVideoMetadata({ ...currentMetadata, ...extractedMetadata });
        } catch (error) {
            console.error('Failed to extract video metadata:', error);
        }
    };

    useEffect(() => {
        setVideoData(null);
        setVideoMetadata(null);
        setIsVideoLoaded(false);
        setIsVideoPlaying(false);
        fetchVideoData();
    }, [videoEntity.id, isYoutubeEmbed]);

    useEffect(() => {
        if (videoUrl && videoMetadata && !videoMetadata.duration) {
            extractAndUpdateMetadata(videoMetadata);
        }
    }, [videoUrl, videoMetadata]);

    const handleRightClick = (e) => {
        e.preventDefault();
        setContextMenuIsOpen(true);
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
    };

    const handleDeleteVideo = async () => {
        setDeleteConfirmModalIsOpen(false);
        try {
            if (extension.options.onDeleteMedia) {
                extension.options.onDeleteMedia(videoEntity.id, 'VIDEO');
            }
            deleteNode();
            toastr.success(t('video') + t('deleted'));
        } catch (error) {
            console.error('Error deleting video:', error);
            toastr.error(t('error deleting video'));
        }
    };

    const handleDownload = async () => {
        try {
            const result = await videoApi.download(videoEntity.id);
            if (result.success) {
                toastr.success(t('videoDownloaded'));
            }
        } catch (error) {
            console.error('Error downloading video:', error);
            toastr.error(t('errorDownloadingVideo'));
        }
    };

    const handleOpenYoutube = () => {
        if (videoEntity.sourceUrl) {
            window.open(videoEntity.sourceUrl, '_blank');
        }
    };

    return (
        <NodeViewWrapper className='relative' data-type="videoNode">
            <div className='select-none cursor-pointer inline-block w-full relative' onContextMenu={handleRightClick}
                onMouseDown={(e) => { if (e.target === e.currentTarget) e.stopPropagation(); }}>
                {isYoutubeEmbed ? (
                    youtubeEmbedUrl ? (
                        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                            <iframe
                                src={youtubeEmbedUrl}
                                title={videoEntity.name || 'YouTube video'}
                                className="absolute inset-0 w-full h-full rounded"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                            />
                        </div>
                    ) : (
                        t('loading') + '...'
                    )
                ) : videoData && videoUrl ? (
                    <>
                        <video
                            ref={videoRef}
                            src={videoUrl}
                            controls
                            controlsList="nodownload"
                            className='rounded w-full'
                            preload="none"
                            onLoadedData={() => setIsVideoLoaded(true)}
                            onPlay={() => setIsVideoPlaying(true)}
                            onPause={() => setIsVideoPlaying(false)}
                            onEnded={() => setIsVideoPlaying(false)}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onMouseUp={(e) => e.stopPropagation()}
                            onFocus={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                            onKeyUp={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                            onPointerUp={(e) => e.stopPropagation()}
                        >
                            Your browser does not support the video tag.
                        </video>
                        {videoMetadata?.duration && !isVideoLoaded && (
                            <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded pointer-events-none">
                                {Math.floor(videoMetadata.duration / 60)}:{String(Math.floor(videoMetadata.duration % 60)).padStart(2, '0')}
                            </div>
                        )}
                    </>
                ) : (
                    t('loading') + '...'
                )}
            </div>
            <ContextMenu isOpen={contextMenuIsOpen} onClose={() => setContextMenuIsOpen(false)} position={{ top: contextMenuPosition.y, left: contextMenuPosition.x }}>
                <div className='flex flex-col gap-2'>
                    {!isYoutubeEmbed && (
                        <>
                            <ActionButton onClick={() => videoRef.current?.play()} color='green'>{t('play')}</ActionButton>
                            <ActionButton onClick={() => videoRef.current?.pause()}>{t('pause')}</ActionButton>
                            <ActionButton onClick={handleDownload} color='purple'>{t('download')}</ActionButton>
                        </>
                    )}
                    {isYoutubeEmbed && (
                        <ActionButton onClick={handleOpenYoutube} color='purple'>{t('open on youtube')}</ActionButton>
                    )}
                    {editable && (
                        <ActionButton onClick={() => setDeleteConfirmModalIsOpen(true)} color='red'>{t('deleteVideo')}</ActionButton>
                    )}
                </div>
            </ContextMenu>
            <ConfirmModal message={t('sureDeletingVideo')} isOpen={deleteConfirmModalIsOpen} onClose={() => setDeleteConfirmModalIsOpen(false)} onConfirm={handleDeleteVideo} />
        </NodeViewWrapper>
    );
};

export default TiptapVideo;
