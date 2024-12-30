import React from 'react';
import Button from '@mui/material/Button';

const ExampleButtons = () => {
    return (
        <div>
            <Button variant="text" color="primary">Text Primary</Button>
            <Button variant="contained" color="secondary">Contained Secondary</Button>
            <Button variant="outlined" color="success">Outlined Success</Button>
            <Button variant="contained" color="error">Contained Error</Button>
            <Button variant="text" color="info">Text Info</Button>
            <Button variant="outlined" color="warning">Outlined Warning</Button>
        </div>
    );
};

export default ExampleButtons;