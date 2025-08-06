import React, { useState, useEffect, useContext, useRef } from 'react';
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

    const fetchVideoData = async () => {
        console.warn('WARNING! fetching video data...');
        try {
            const data = await videoApi.getDataById(videoEntity.id);
            console.log('Raw video data from backend:', data);
            console.log('Type of video data:', typeof data);
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
            >
                {videoData ? 
                    (() => {
                        // Convert Windows path to a URL-safe format
                        // Ensure we have proper protocol format with three slashes
                        const normalizedPath = videoData.replace(/\\/g, '/');
                        const videoUrl = `media-file:///${normalizedPath}`;
                        console.log('Generated video URL:', videoUrl);
                        console.log('Original video data:', videoData);
                        console.log('Normalized path:', normalizedPath);
                        return (
                            <video
                                ref={videoRef}
                                src={videoUrl}
                                controls
                                className="rounded w-full"
                                onLoadStart={() => console.log('Video loadstart event')}
                                onError={(e) => {
                                    console.error('Video error:', e.target.error);
                                    console.error('Video src:', e.target.src);
                                }}
                                onCanPlay={() => console.log('Video can play')}
                            >
                                Your browser does not support the video tag.
                            </video>
                        );
                    })()
                    : t('loading') + '...'
                }
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