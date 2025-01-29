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
    };

    const activeHeadStyle = {
        ...headStyle,
        backgroundColor: '#d0f0c0', // Light green color
    };

    const handleClearFilter = (e) => {
        e.stopPropagation();
        clearFilter();
    }

    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={isFilterActive ? activeHeadStyle : headStyle}>
                <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                    {isFilterActive && (
                        <IconButton color="primary" onClick={handleClearFilter}>
                            <ClearIcon />
                        </IconButton>
                    )}
                    <Typography>{title}</Typography>
                </Box>
            </AccordionSummary>
            <AccordionDetails>
                {children}
            </AccordionDetails>
        </Accordion>
    );
};

export default FilterAccordion;