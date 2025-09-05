import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { videoApi } from '../../../../backend-adapter/BackendAdapter';
import { AppContext } from '../../../../store/app-context';
import { ReadContext } from '../../../../store/read-context';
import ContextMenu from '../../../common/ContextMenu';
import ActionButton from '../../../common/ActionButton';
import ConfirmModal from '../../../common/ConfirmModal';
import { MediaMetadataExtractor } from '../../../../utils/MediaMetadataExtractor';
import toastr from 'toastr';

// ✅ VIDEO DEBUG: Set to true to enable detailed video event logging
const DEBUG_VIDEO_EVENTS = false;

const Video = (props) => {
    const block = props.block;
    const contentState = props.contentState;
    const onDelete = props.blockProps.onDelete;

    const [videoData, setVideoData] = useState(null);
    const [videoMetadata, setVideoMetadata] = useState(null);
    const [contextMenuIsOpen, setContextMenuIsOpen] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 10, y: 10 });
    const [deleteConfirmModalIsOpen, setDeleteConfirmModalIsOpen] = useState(false);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);

    const { translate: t } = useContext(AppContext);
    const { editable } = useContext(ReadContext);

    const videoEntity = contentState.getEntity(block.getEntityAt(0)).getData();
    const videoRef = useRef(null); // Reference to the video element

    // Memoize the video URL to prevent recalculation on every render
    const videoUrl = useMemo(() => {
        if (!videoData) return null;
        
        // Get platform information
        const platform = window.versions?.platform() || 'unknown';
        
        console.log('🎬 Video URL generation:');
        console.log('  - Platform:', platform);
        console.log('  - Original path:', videoData);
        
        let finalUrl;
        if (platform === 'win32') {
            // Windows: Normalize path and handle drive letters
            const normalizedPath = videoData.replace(/\\/g, '/');
            if (normalizedPath.match(/^[a-zA-Z]:\//)) {
                const driveLetter = normalizedPath[0].toLowerCase();
                const pathWithoutDrive = normalizedPath.substring(2); // Remove "C:"
                finalUrl = `media-file://${driveLetter}${pathWithoutDrive}`;
            } else {
                finalUrl = `media-file:///${normalizedPath}`;
            }
        } else {
            // macOS/Linux: Use the absolute path as-is with proper URL format
            // For macOS paths like /Users/..., we need media-file:///Users/...
            finalUrl = `media-file://${videoData}`;
        }
        
        console.log('  - Final URL:', finalUrl);
        return finalUrl;
    }, [videoData]);

    const fetchVideoData = async () => {
        try {
            const result = await videoApi.getDataById(videoEntity.id);
            console.log('🎬 Video fetch result:', result);
            // Handle both old format (string) and new format (object)
            if (typeof result === 'string') {
                setVideoData(result);
                setVideoMetadata(null);
            } else {
                setVideoData(result.path);
                setVideoMetadata(result.metadata);
                console.log('🎬 Video metadata:', result.metadata);
                
                // If duration is missing, extract it using browser-based method
                if (!result.metadata.duration && videoUrl) {
                    extractAndUpdateMetadata(result.metadata);
                }
            }
        } catch (error) {
            console.error('Error fetching video data:', error);
        }
    };
    
    const extractAndUpdateMetadata = async (currentMetadata) => {
        try {
            console.log('🎬 Extracting missing video metadata...');
            const extractedMetadata = await MediaMetadataExtractor.extractVideoMetadata(videoUrl);
            
            // Update the database with the extracted metadata
            await videoApi.updateMetadata(videoEntity.id, extractedMetadata);
            
            // Update the local state
            setVideoMetadata({
                ...currentMetadata,
                ...extractedMetadata
            });
            
            console.log('✅ Video metadata updated successfully');
        } catch (error) {
            console.error('❌ Failed to extract video metadata:', error);
        }
    };

    useEffect(() => {
        fetchVideoData();
    }, [videoEntity]);
    
    // Extract metadata when videoUrl becomes available and duration is missing
    useEffect(() => {
        if (videoUrl && videoMetadata && !videoMetadata.duration) {
            extractAndUpdateMetadata(videoMetadata);
        }
    }, [videoUrl, videoMetadata]);

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
                className="select-none cursor-pointer inline-block w-full relative"
                onContextMenu={handleRightClick}
                onMouseDown={(e) => {
                    // Only prevent propagation if clicking on the video container itself
                    if (e.target === e.currentTarget) {
                        e.stopPropagation();
                    }
                }}
            >
                {videoData && videoUrl ? (
                    <>
                        <video
                            ref={videoRef}
                            src={videoUrl}
                            controls
                            controlsList="nodownload"
                            className="rounded w-full"
                            preload="none" // ✅ CRITICAL: Prevent automatic preloading
                            loading="lazy" // ✅ Lazy load videos for better memory management
                            onLoadStart={() => {if (DEBUG_VIDEO_EVENTS) console.log('Video loadstart event')}}
                            onLoadedData={() => {
                                if (DEBUG_VIDEO_EVENTS) console.log('Video loaded data');
                                setIsVideoLoaded(true);
                            }}
                            onPlay={() => {
                                if (DEBUG_VIDEO_EVENTS) console.log('Video play event');
                                setIsVideoPlaying(true);
                            }}
                            onPause={() => {
                                if (DEBUG_VIDEO_EVENTS) console.log('Video pause event');
                                setIsVideoPlaying(false);
                            }}
                            onEnded={() => {
                                if (DEBUG_VIDEO_EVENTS) console.log('Video ended event');
                                setIsVideoPlaying(false);
                            }}
                            onError={(e) => {
                                console.error('Video error:', e.target.error);
                                console.error('Video src:', e.target.src);
                                if (e.target.error) {
                                    console.error('Error code:', e.target.error.code);
                                    console.error('Error message:', e.target.error.message);
                                }
                            }}
                            onCanPlay={() => {if (DEBUG_VIDEO_EVENTS) console.log('Video can play')}}
                            onWaiting={() => {if (DEBUG_VIDEO_EVENTS) console.log('Video waiting for data')}}
                            onSuspend={() => {if (DEBUG_VIDEO_EVENTS) console.log('Video suspended')}}
                            onStalled={() => {if (DEBUG_VIDEO_EVENTS) console.log('Video stalled')}}
                            onProgress={(e) => {
                                if (DEBUG_VIDEO_EVENTS && e.target.buffered.length > 0) {
                                    const buffered = e.target.buffered.end(0);
                                    const duration = e.target.duration || 0;
                                    console.log(`Video progress: buffered ${buffered.toFixed(1)}s / ${duration.toFixed(1)}s`);
                                }
                            }}
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
                        {/* Duration overlay - shows metadata duration only when video is not loaded/playing */}
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