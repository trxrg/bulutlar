import React, { useContext, useState } from 'react';
import { AppContext } from '../../../../store/app-context.jsx';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

const SavedFilterCard = ({ filter, onApply, onDelete }) => {
    const { translate: t } = useContext(AppContext);
    const [confirmingDelete, setConfirmingDelete] = useState(false);

    const handleCardClick = () => {
        if (!confirmingDelete) {
            onApply(filter.id);
        }
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        setConfirmingDelete(true);
    };

    const handleConfirmDelete = (e) => {
        e.stopPropagation();
        onDelete(filter.id);
        setConfirmingDelete(false);
    };

    const handleCancelDelete = (e) => {
        e.stopPropagation();
        setConfirmingDelete(false);
    };

    return (
        <div
            className='flex items-center justify-between p-3 rounded cursor-pointer hover:opacity-80 transition-opacity gap-2'
            style={{ 
                backgroundColor: 'var(--bg-secondary)', 
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)'
            }}
            onClick={handleCardClick}
        >
            <span 
                className='flex-1 select-none overflow-hidden text-ellipsis whitespace-nowrap'
                title={filter.name}
            >
                {filter.name}
            </span>
            <div className='flex gap-1 flex-shrink-0'>
                {confirmingDelete ? (
                    <>
                        <Tooltip title={t('confirm delete')}>
                            <IconButton
                                size="small"
                                onClick={handleConfirmDelete}
                                sx={{ 
                                    color: '#B53A16',
                                    '&:hover': {
                                        backgroundColor: 'rgba(181, 58, 22, 0.1)',
                                    }
                                }}
                            >
                                <CheckIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={t('cancel')}>
                            <IconButton
                                size="small"
                                onClick={handleCancelDelete}
                                sx={{ 
                                    color: 'var(--text-secondary)',
                                    '&:hover': {
                                        backgroundColor: 'var(--bg-tertiary)',
                                    }
                                }}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </>
                ) : (
                    <Tooltip title={t('delete filter')}>
                        <IconButton
                            size="small"
                            onClick={handleDeleteClick}
                            sx={{ 
                                color: '#B53A16',
                                '&:hover': {
                                    backgroundColor: 'rgba(181, 58, 22, 0.1)',
                                }
                            }}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
            </div>
        </div>
    );
};

export default SavedFilterCard;
