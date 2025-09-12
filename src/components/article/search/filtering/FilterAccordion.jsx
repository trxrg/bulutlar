import React from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ClearIcon from '@mui/icons-material/Clear';
import { Typography, AccordionDetails, AccordionSummary, Accordion, Box } from '@mui/material';
import IconButton from '@mui/material/Button';


const FilterAccordion = ({ title, isFilterActive, clearFilter, children }) => {
    
    const headStyle = {
        fontWeight: 'bold',
        padding: '10px 20px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        backgroundColor: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
    };

    const activeHeadStyle = {
        ...headStyle,
        backgroundColor: 'var(--bg-tertiary)',
        color: 'var(--text-primary)',
    };

    const handleClearFilter = (e) => {
        e.stopPropagation();
        clearFilter();
    }

    return (
        <Accordion 
            sx={{
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                '& .MuiAccordionSummary-expandIconWrapper': {
                    color: 'var(--text-primary)',
                },
                '& .MuiAccordionDetails-root': {
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                },
            }}
        >
            <AccordionSummary 
                expandIcon={<ExpandMoreIcon sx={{ color: 'var(--text-primary)' }} />} 
                sx={isFilterActive ? activeHeadStyle : headStyle}
            >
                <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                    {isFilterActive && (
                        <IconButton 
                            onClick={handleClearFilter}
                            sx={{ 
                                color: 'var(--text-primary)',
                                '&:hover': {
                                    backgroundColor: 'var(--button-hover)',
                                }
                            }}
                        >
                            <ClearIcon />
                        </IconButton>
                    )}
                    <Typography sx={{ color: 'var(--text-primary)' }}>{title}</Typography>
                </Box>
            </AccordionSummary>
            <AccordionDetails>
                {children}
            </AccordionDetails>
        </Accordion>
    );
};

export default FilterAccordion;