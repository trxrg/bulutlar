import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { audioApi } from '../../../../../backend-adapter/BackendAdapter';
import { AppContext } from '../../../../../store/app-context';
import { ReadContext } from '../../../../../store/read-context';
import ContextMenu from '../../../../common/ContextMenu';
import ActionButton from '../../../../common/ActionButton';
import ConfirmModal from '../../../../common/ConfirmModal';
import { MediaMetadataExtractor } from '../../../../../utils/MediaMetadataExtractor';
import toastr from 'toastr';

const TiptapAudio = ({ node, deleteNode, extension }) => {
    const audioEntity = node.attrs;

    const [audioData, setAudioData] = useState(null);
    const [audioMetadata, setAudioMetadata] = useState(null);
    const [contextMenuIsOpen, setContextMenuIsOpen] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 10, y: 10 });
    const [deleteConfirmModalIsOpen, setDeleteConfirmModalIsOpen] = useState(false);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [isAudioLoaded, setIsAudioLoaded] = useState(false);

    const { translate: t } = useContext(AppContext);
    const { editable } = useContext(ReadContext);
    const audioRef = useRef(null);

    const audioUrl = useMemo(() => {
        if (!audioData) return null;
        const normalizedPath = audioData.replace(/\\/g, '/');
        const platform = window.versions?.platform() || 'unknown';
        if (platform === 'win32') {
            if (normalizedPath.match(/^[a-zA-Z]:\//)) {
                const driveLetter = normalizedPath[0].toLowerCase();
                const pathWithoutDrive = normalizedPath.substring(2);
                return `media-file://${driveLetter}${pathWithoutDrive}`;
            }
            return `media-file:///${normalizedPath}`;
        }
        return `media-file://${audioData}`;
    }, [audioData]);

    const fetchAudioData = async () => {
        try {
            const result = await audioApi.getDataById(audioEntity.id);
            if (typeof result === 'string') {
                setAudioData(result);
                setAudioMetadata(null);
            } else {
                setAudioData(result.path);
                setAudioMetadata(result.metadata);
            }
        } catch (error) {
            console.error('Error fetching audio data:', error);
        }
    };

    const extractAndUpdateMetadata = async (currentMetadata) => {
        try {
            const extractedMetadata = await MediaMetadataExtractor.extractAudioMetadata(audioUrl);
            await audioApi.updateMetadata(audioEntity.id, extractedMetadata);
            setAudioMetadata({ ...currentMetadata, ...extractedMetadata });
        } catch (error) {
            console.error('Failed to extract audio metadata:', error);
        }
    };

    useEffect(() => { fetchAudioData(); }, [audioEntity.id]);

    useEffect(() => {
        if (audioUrl && audioMetadata && !audioMetadata.duration) {
            extractAndUpdateMetadata(audioMetadata);
        }
    }, [audioUrl, audioMetadata]);

    const handleRightClick = (e) => {
        e.preventDefault();
        setContextMenuIsOpen(true);
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
    };

    const handleDeleteAudio = async () => {
        setDeleteConfirmModalIsOpen(false);
        try {
            if (extension.options.onDeleteMedia) {
                extension.options.onDeleteMedia(audioEntity.id, 'AUDIO');
            }
            deleteNode();
            toastr.success(t('audio') + t('deleted'));
        } catch (error) {
            console.error('Error deleting audio:', error);
            toastr.error(t('error deleting audio'));
        }
    };

    const handleDownload = async () => {
        try {
            const result = await audioApi.download(audioEntity.id);
            if (result.success) {
                toastr.success(t('audioDownloaded'));
            }
        } catch (error) {
            console.error('Error downloading audio:', error);
            toastr.error(t('errorDownloadingAudio'));
        }
    };

    return (
        <NodeViewWrapper className='relative' data-type="audioNode">
            <div className='select-none cursor-pointer inline-block w-full relative' onContextMenu={handleRightClick}
                onMouseDown={(e) => { if (e.target === e.currentTarget) e.stopPropagation(); }}>
                {audioData && audioUrl ? (
                    <>
                        <audio
                            ref={audioRef}
                            src={audioUrl}
                            controls
                            controlsList="nodownload"
                            className='rounded w-full'
                            preload="none"
                            onLoadedData={() => setIsAudioLoaded(true)}
                            onPlay={() => setIsAudioPlaying(true)}
                            onPause={() => setIsAudioPlaying(false)}
                            onEnded={() => setIsAudioPlaying(false)}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onMouseUp={(e) => e.stopPropagation()}
                            onFocus={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                            onKeyUp={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                            onPointerUp={(e) => e.stopPropagation()}
                        >
                            Your browser does not support the audio element.
                        </audio>
                        {audioMetadata?.duration && !isAudioLoaded && (
                            <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded pointer-events-none">
                                {Math.floor(audioMetadata.duration / 60)}:{String(Math.floor(audioMetadata.duration % 60)).padStart(2, '0')}
                            </div>
                        )}
                    </>
                ) : (
                    t('loading') + '...'
                )}
            </div>
            <ContextMenu isOpen={contextMenuIsOpen} onClose={() => setContextMenuIsOpen(false)} position={{ top: contextMenuPosition.y, left: contextMenuPosition.x }}>
                <div className='flex flex-col gap-2'>
                    <ActionButton onClick={() => audioRef.current?.play()} color='green'>{t('play')}</ActionButton>
                    <ActionButton onClick={() => audioRef.current?.pause()}>{t('pause')}</ActionButton>
                    <ActionButton onClick={handleDownload} color='purple'>{t('download')}</ActionButton>
                    {editable && (
                        <ActionButton onClick={() => setDeleteConfirmModalIsOpen(true)} color='red'>{t('deleteAudio')}</ActionButton>
                    )}
                </div>
            </ContextMenu>
            <ConfirmModal message={t('sureDeletingAudio')} isOpen={deleteConfirmModalIsOpen} onClose={() => setDeleteConfirmModalIsOpen(false)} onConfirm={handleDeleteAudio} />
        </NodeViewWrapper>
    );
};

export default TiptapAudio;
