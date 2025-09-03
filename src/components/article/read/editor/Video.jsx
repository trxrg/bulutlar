import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { videoApi } from '../../../../backend-adapter/BackendAdapter';
import { AppContext } from '../../../../store/app-context';
import { ReadContext } from '../../../../store/read-context';
import ContextMenu from '../../../common/ContextMenu';
import ActionButton from '../../../common/ActionButton';
import ConfirmModal from '../../../common/ConfirmModal';
import toastr from 'toastr';

const Video = (props) => {
    const block = props.block;
    const contentState = props.contentState;
    const onDelete = props.blockProps.onDelete;

    const [videoData, setVideoData] = useState(null);
    const [contextMenuIsOpen, setContextMenuIsOpen] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 10, y: 10 });
    const [deleteConfirmModalIsOpen, setDeleteConfirmModalIsOpen] = useState(false);

    const { translate: t } = useContext(AppContext);
    const { editable } = useContext(ReadContext);

    const videoEntity = contentState.getEntity(block.getEntityAt(0)).getData();
    const videoRef = useRef(null); // Reference to the video element

    // Memoize the video URL to prevent recalculation on every render
    const videoUrl = useMemo(() => {
        if (!videoData) return null;
        const platform = window.versions?.platform() || 'unknown';
        let finalUrl;
        if (platform === 'win32') {
            const normalizedPath = videoData.replace(/\\/g, '/');
            if (normalizedPath.match(/^[a-zA-Z]:\//)) {
                const driveLetter = normalizedPath[0].toLowerCase();
                const pathWithoutDrive = normalizedPath.substring(2);
                finalUrl = `media-file://${driveLetter}${pathWithoutDrive}`;
            } else {
                finalUrl = `media-file:///${normalizedPath}`;
            }
        } else {
            finalUrl = `media-file://${videoData}`;
        }
        return finalUrl;
    }, [videoData]);

    // Lazy loading: only set the actual src once the element is in view
    const [isInView, setIsInView] = useState(false);
    const intersectionRef = useRef(null);

    useEffect(() => {
        const el = intersectionRef.current;
        if (!el) return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            });
        }, { root: null, rootMargin: '200px', threshold: 0.01 });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const fetchVideoData = async () => {
        try {
            const data = await videoApi.getDataById(videoEntity.id);
            setVideoData(data);
        } catch (error) {
            console.error('Error fetching video data:', error);
        }
    };

    useEffect(() => {
        fetchVideoData();
    }, [videoEntity]);

    const handleRightClick = (e) => {
        e.preventDefault();

        const grandParentRect = e.currentTarget.getBoundingClientRect();

        const posx = e.clientX - grandParentRect.left;
        const posy = e.clientY - grandParentRect.top;

        setContextMenuIsOpen(true);
        setContextMenuPosition({ x: posx, y: posy });
    };

    const handleDeleteVideo = async () => {
        setDeleteConfirmModalIsOpen(false);
        try {
            onDelete(videoEntity.id);
            toastr.success(t('video') + t('deleted'));
        } catch (error) {
            console.error('Error deleting video:', error);
            toastr.error(t('error deleting video'));
        }
    };

    const handlePlay = () => {
        if (videoRef.current) {
            videoRef.current.play();
        }
    };

    const handlePause = () => {
        if (videoRef.current) {
            videoRef.current.pause();
        }
    };

    const handleDownload = async () => {
        try {
            const result = await videoApi.download(videoEntity.id);
            if (result.success) {
                toastr.success(t('videoDownloaded'));
            } else if (result.canceled) {
                // User canceled, no need to show error
            }
        } catch (error) {
            console.error('Error downloading video:', error);
            toastr.error(t('errorDownloadingVideo'));
        }
    };

    return (
        <div className="relative">
            <div
                className="select-none cursor-pointer inline-block w-full"
                onContextMenu={handleRightClick}
                onMouseDown={(e) => {
                    // Only prevent propagation if clicking on the video container itself
                    if (e.target === e.currentTarget) {
                        e.stopPropagation();
                    }
                }}
            >
                <div ref={intersectionRef} className="w-full">
                    {videoData && videoUrl && isInView ? (
                        <video
                            ref={videoRef}
                            // Use data-src pattern to delay setting src until inView (already gated by isInView)
                            src={videoUrl}
                            preload="metadata"
                            controls
                            controlsList="nodownload"
                            className="rounded w-full"
                            onLoadStart={() => console.log('Video loadstart (metadata only)')}
                            onError={(e) => {
                                console.error('Video error:', e.target.error);
                            }}
                            onCanPlay={() => console.log('Video can play')}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onMouseUp={(e) => e.stopPropagation()}
                            onFocus={(e) => e.stopPropagation()}
                            onBlur={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                            onKeyUp={(e) => e.stopPropagation()}
                            onInput={(e) => e.stopPropagation()}
                            onChange={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                            onPointerUp={(e) => e.stopPropagation()}
                        >
                            Your browser does not support the video tag.
                        </video>
                    ) : (
                        <div className="w-full h-48 flex items-center justify-center bg-stone-800 text-stone-400 text-sm rounded">
                            {t('loading')}...
                        </div>
                    )}
                </div>
            </div>
            <ContextMenu
                isOpen={contextMenuIsOpen}
                onClose={() => setContextMenuIsOpen(false)}
                position={{ top: contextMenuPosition.y, left: contextMenuPosition.x }}
            >
                <div className="flex flex-col gap-2">
                    <ActionButton onClick={handlePlay} color="green">
                        {t('play')}
                    </ActionButton>
                    <ActionButton onClick={handlePause} color="blue">
                        {t('pause')}
                    </ActionButton>
                    <ActionButton onClick={handleDownload} color="purple">
                        {t('download')}
                    </ActionButton>
                    {editable && (
                        <ActionButton onClick={() => setDeleteConfirmModalIsOpen(true)} color="red">
                            {t('deleteVideo')}
                        </ActionButton>
                    )}
                </div>
            </ContextMenu>
            <ConfirmModal
                message={t('sureDeletingVideo')}
                isOpen={deleteConfirmModalIsOpen}
                onClose={() => setDeleteConfirmModalIsOpen(false)}
                onConfirm={handleDeleteVideo}
            />
        </div>
    );
};

export default Video;