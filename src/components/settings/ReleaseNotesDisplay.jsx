import React from 'react';
import { Box, Typography } from '@mui/material';

const headingSx = {
    color: 'var(--text-primary)',
    fontWeight: 600,
    mt: 1.5,
    mb: 0.5,
};

const bulletSx = {
    color: 'var(--text-secondary)',
    pl: 2,
    display: 'list-item',
    listStylePosition: 'outside',
    ml: 2,
};

function renderLine(line, index) {
    const trimmed = line.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('## [')) {
        const title = trimmed.replace(/^##\s*/, '');
        return (
            <Typography key={index} variant="subtitle2" sx={headingSx}>
                {title}
            </Typography>
        );
    }

    if (trimmed.startsWith('### ')) {
        return (
            <Typography key={index} variant="body2" sx={{ ...headingSx, fontWeight: 500, mt: 1 }}>
                {trimmed.slice(4)}
            </Typography>
        );
    }

    if (trimmed.startsWith('- ')) {
        return (
            <Typography key={index} component="li" variant="body2" sx={bulletSx}>
                {trimmed.slice(2)}
            </Typography>
        );
    }

    return (
        <Typography key={index} variant="body2" sx={{ color: 'var(--text-secondary)' }}>
            {trimmed}
        </Typography>
    );
}

const ReleaseNotesDisplay = ({ notes }) => {
    if (!notes?.trim()) return null;

    return (
        <Box
            sx={{
                maxHeight: 280,
                overflowY: 'auto',
                p: 1.5,
                borderRadius: 1,
                border: '1px solid var(--border-secondary)',
                backgroundColor: 'var(--bg-tertiary)',
            }}
        >
            {notes.split('\n').map((line, index) => renderLine(line, index))}
        </Box>
    );
};

export default ReleaseNotesDisplay;
