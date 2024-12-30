import React, { useContext } from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Button from '@mui/material/Button';
import { AppContext } from '../../store/app-context';
import ExampleButtons from '../test/ExampleButtons';

const SettingsScreen = () => {
    const { translate: t } = useContext(AppContext);

    return (
        <div className='max-w-6xl w-full'>
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>{t('database')}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <div className='flex-col'>
                        <Button variant="contained" color="primary" onClick={() => alert('Button clicked!')}>
                            {t('export db')}
                        </Button>
                    </div>
                </AccordionDetails>
            </Accordion>
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>{t('appearance')}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Typography>
                        Manage your appearance settings here.
                    </Typography>
                    <ExampleButtons />
                </AccordionDetails>
            </Accordion>
            {/* Add more Accordion components for other settings categories */}
        </div>
    );
};

export default SettingsScreen;