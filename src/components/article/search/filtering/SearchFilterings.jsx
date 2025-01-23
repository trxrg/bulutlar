import React, { useContext } from 'react';
import OwnerFiltering from './OwnerFiltering.jsx';
import TagFiltering from './TagFiltering.jsx';
import CategoryFiltering from './CategoryFiltering.jsx';
import KeywordFiltering from './KeywordFiltering.jsx';
import { AppContext } from '../../../../store/app-context.jsx';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Typography, AccordionDetails, AccordionSummary, Accordion } from '@mui/material';

const SearchFilterings = () => {

    const { translate: t } = useContext(AppContext);

    const headStyle = {
        fontWeight: 'bold',
        padding: '10px 20px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    };

    return (
        <>
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={headStyle}>
                    <Typography>{t('keyword')}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <KeywordFiltering />
                </AccordionDetails>
            </Accordion>
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={headStyle}>
                    <Typography>{t('category')}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <CategoryFiltering />
                </AccordionDetails>
            </Accordion>
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={headStyle}>
                    <Typography>{t('owner')}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <OwnerFiltering />
                </AccordionDetails>
            </Accordion>
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={headStyle}>
                    <Typography>{t('tag')}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <TagFiltering />
                </AccordionDetails>
            </Accordion>
        </>
    );
};

export default SearchFilterings;


