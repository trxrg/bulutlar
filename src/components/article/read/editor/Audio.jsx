import React, { useState, useEffect, useContext, useRef } from 'react';
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

    const fetchAudioData = async () => {
        console.warn('WARNING! fetching audio data...');
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
            <div className='select-none cursor-pointer inline-block w-full' onContextMenu={handleRightClick}>
                {audioData ? 
                    (() => {
                        // Convert Windows path to a URL-safe format
                        const normalizedPath = audioData.replace(/\\/g, '/');
                        return (
                            <audio 
                                ref={audioRef}
                                src={`media-file:///${normalizedPath}`} 
                                controls 
                                className='rounded w-full'
                            >
                                Your browser does not support the audio element.
                            </audio>
                        );
                    })()
                    : t('loading') + '...'
                }
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
