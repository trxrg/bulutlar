import React, { useContext } from 'react';
import { AppContext } from '../../store/app-context.jsx';
import { DBContext } from '../../store/db-context.jsx';
import Button from '@mui/material/Button';
import ThemeToggle from '../common/ThemeToggle.jsx';
import '../../styles.css';
import packageJson from '../../../package.json';

const HomeScreen = () => {

    const { setActiveScreen, translate: t } = useContext(AppContext);
    const { dbVersion } = useContext(DBContext);

    const primaryButtonProps = {
        variant: 'contained',
        sx: {
            fontFamily: '"Orbitron", monospace, sans-serif',
            fontWeight: '700',
            fontSize: '1.2rem',
            letterSpacing: '0.05em',
            backgroundColor: '#e3c204ff', // gold
            color: '#222', // dark text for contrast
            '&:hover': {
                backgroundColor: '#d4af00', // richer, deeper gold on hover
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(227, 194, 4, 0.3)'
            }
        }
    };
    const secondaryButtonProps = {
        variant: 'contained',
        sx: {
            fontFamily: '"Orbitron", monospace, sans-serif',
            fontWeight: '600',
            fontSize: { xs: '1rem', sm: '1.1rem' }, // Responsive font size
            letterSpacing: '0.05em',
            backgroundColor: 'var(--border-primary)',
            color: '#f9fafb',
            padding: '12px 16px', // Add more padding
            minHeight: '48px', // Ensure minimum height
            whiteSpace: 'nowrap', // Prevent text wrapping
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            '&:hover': {
                backgroundColor: '#4a6b1a', // lighter, more vibrant green
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(74, 107, 26, 0.3)'
            }
        }
    };

    const settingsButtonProps = {
        variant: 'contained',
        sx: {
            fontFamily: '"Orbitron", monospace, sans-serif',
            fontWeight: '600',
            fontSize: '1.2rem',
            letterSpacing: '0.05em',
            backgroundColor: '#B53A16',
            color: '#f9fafb',
            '&:hover': {
                backgroundColor: '#e11d48', // brighter, more vibrant red
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(225, 29, 72, 0.3)'
            }
        }
    };

    return (
        <div className='flex items-center justify-center w-full h-full' style={{
            fontFamily: '"Trebuchet MS", sans-serif',
            background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)'
        }}>
            {/* Theme toggle button in top-right corner */}
            <div className='absolute top-6 right-6 z-10'>
                <ThemeToggle />
            </div>

            {/* Main content centered */}
            <div className='flex flex-col items-center justify-center gap-8 px-8 py-12 rounded-3xl shadow-lg' style={{
                backgroundColor: 'var(--bg-primary)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1)',
                border: '2px solid var(--border-primary)',
                backdropFilter: 'blur(10px)',
                maxWidth: '600px',
                width: '90%'
            }}>
                <div className='flex items-center gap-4 mb-4'>
                    <h1 className='text-5xl select-none' style={{
                        color: 'var(--border-primary)',
                        fontFamily: '"Orbitron", monospace, sans-serif',
                        fontWeight: '900',
                        letterSpacing: '0.2em',
                        textShadow: '0 2px 4px var(--shadow)',
                        textTransform: 'uppercase'
                    }}>
                        bulutlar
                    </h1>
                </div>

                {/* Navigation buttons */}
                <div className='flex flex-col gap-3 w-full max-w-lg'>
                    <Button size="large" fullWidth onClick={() => setActiveScreen('tabs')} {...primaryButtonProps}>
                        {t('all articles')}
                    </Button>

                    <div className='grid grid-cols-2 gap-3'>
                        <Button size="large" fullWidth onClick={() => setActiveScreen('categories')} {...secondaryButtonProps}>
                            {t('categories')}
                        </Button>
                        <Button size="large" fullWidth onClick={() => setActiveScreen('groups')} {...secondaryButtonProps}>
                            {t('groups')}
                        </Button>
                        <Button size="large" onClick={() => setActiveScreen('owners')} {...secondaryButtonProps}>
                            {t('owners')}
                        </Button>
                        <Button size="large" onClick={() => setActiveScreen('tags')} {...secondaryButtonProps}>
                            {t('tags')}
                        </Button>
                        <Button size="large" onClick={() => setActiveScreen('annotations')} {...secondaryButtonProps}>
                            {t('annotations')}
                        </Button>
                        <Button size="large" onClick={() => setActiveScreen('quotes')} {...secondaryButtonProps}>
                            {t('quotes')}
                        </Button>
                    </div>

                    <Button size="large" fullWidth onClick={() => setActiveScreen('settings')} {...secondaryButtonProps}>
                        {t('settings')}
                    </Button>
                </div>

                {/* Version info */}
                <div className='flex flex-col items-center gap-1 mt-4 text-sm' style={{ color: 'var(--text-tertiary)' }}>
                    <span>DB: {dbVersion} • App: {packageJson.version}</span>
                </div>
            </div>
        </div>
    );
};

export default HomeScreen;