import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { audioApi } from '../../../../backend-adapter/BackendAdapter';
import { AppContext } from '../../../../store/app-context';
import { ReadContext } from '../../../../store/read-context';
import ContextMenu from '../../../common/ContextMenu';
import ActionButton from '../../../common/ActionButton';
import ConfirmModal from '../../../common/ConfirmModal';
import toastr from 'toastr';

const Audio = (props) => {
    const block = props.block;
    const contentState = props.contentState;
    const onDelete = props.blockProps.onDelete;

    const [audioData, setAudioData] = useState(null);
    const [contextMenuIsOpen, setContextMenuIsOpen] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 10, y: 10 });
    const [deleteConfirmModalIsOpen, setDeleteConfirmModalIsOpen] = useState(false);
    
    const { translate: t } = useContext(AppContext);
    const { editable } = useContext(ReadContext);

    const audioEntity = contentState.getEntity(block.getEntityAt(0)).getData();
    const audioRef = useRef(null); // Reference to the audio element

    // Memoize the audio URL to prevent recalculation on every render
    const audioUrl = useMemo(() => {
        if (!audioData) return null;
        
        // Normalize path for cross-platform compatibility
        const normalizedPath = audioData.replace(/\\/g, '/');
        
        // For Windows, create URL with drive letter in hostname
        // For macOS/Linux, use standard file:// approach with media-file:// protocol
        const platform = window.versions?.platform() || 'unknown';
        
        console.log('🎵 Audio URL generation:');
        console.log('  - Platform:', platform);
        console.log('  - Original path:', audioData);
        
        let finalUrl;
        if (platform === 'win32') {
            // Windows: if path has drive letter, put it in hostname
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
            finalUrl = `media-file://${audioData}`;
        }
        
        console.log('  - Final URL:', finalUrl);
        return finalUrl;
    }, [audioData]);

    const fetchAudioData = async () => {
        try {
            setAudioData(await audioApi.getDataById(audioEntity.id));
        } catch (error) {
            console.error('Error fetching audio data:', error);
        }
    };

    useEffect(() => {
        fetchAudioData();
    }, [audioEntity]);

    const handleRightClick = (e) => {
        e.preventDefault();

        const grandParentRect = e.currentTarget.getBoundingClientRect();

        const posx = e.clientX - grandParentRect.left;
        const posy = e.clientY - grandParentRect.top;

        setContextMenuIsOpen(true);
        setContextMenuPosition({ x: posx, y: posy });
    }

    const handleDeleteAudio = async () => {
        setDeleteConfirmModalIsOpen(false);
        try {
            onDelete(audioEntity.id);
            toastr.success(t('audio') + t('deleted'));
        } catch (error) {
            console.error('Error deleting audio:', error);
            toastr.error(t('error deleting audio'));
        }        
    }

    const handlePlay = () => {
        if (audioRef.current) {
            audioRef.current.play();
        }
    };

    const handlePause = () => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
    };

    const handleDownload = async () => {
        try {
            const result = await audioApi.download(audioEntity.id);
            if (result.success) {
                toastr.success(t('audioDownloaded'));
            } else if (result.canceled) {
                // User canceled, no need to show error
            }
        } catch (error) {
            console.error('Error downloading audio:', error);
            toastr.error(t('errorDownloadingAudio'));
        }
    };

    return (
        <div className='relative'>
            <div 
                className='select-none cursor-pointer inline-block w-full' 
                onContextMenu={handleRightClick}
                onMouseDown={(e) => {
                    // Only prevent propagation if clicking on the audio container itself
                    if (e.target === e.currentTarget) {
                        e.stopPropagation();
                    }
                }}
            >
                {audioData && audioUrl ? (
                    <audio 
                        ref={audioRef}
                        src={audioUrl} 
                        controls
                        controlsList="nodownload"
                        className='rounded w-full'
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
                        Your browser does not support the audio element.
                    </audio>
                ) : (
                    t('loading') + '...'
                )}
            </div>
            <ContextMenu isOpen={contextMenuIsOpen} onClose={() => setContextMenuIsOpen(false)} position={{ top: contextMenuPosition.y, left: contextMenuPosition.x }}>
                <div className='flex flex-col gap-2'>
                    <ActionButton onClick={handlePlay} color='green'>{t('play')}</ActionButton>
                    <ActionButton onClick={handlePause} color='blue'>{t('pause')}</ActionButton>
                    <ActionButton onClick={handleDownload} color='purple'>{t('download')}</ActionButton>
                    {editable && (
                        <ActionButton onClick={() => setDeleteConfirmModalIsOpen(true)} color='red'>{t('deleteAudio')}</ActionButton>
                    )}
                </div>
            </ContextMenu>
            <ConfirmModal message={t('sureDeletingAudio')} isOpen={deleteConfirmModalIsOpen} onClose={() => setDeleteConfirmModalIsOpen(false)} onConfirm={handleDeleteAudio} />
        </div>
    );
};

export default Audio;
