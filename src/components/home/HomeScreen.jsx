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
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', 
            fontWeight: '600', 
            fontSize: '1.2rem',
            letterSpacing: '0.025em',
            backgroundColor: '#059669',
            color: '#f9fafb',
            '&:hover': {
                backgroundColor: '#047857',
            }
        }
    };
    const secondaryButtonProps = {
        variant: 'contained',
        sx: { 
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', 
            fontWeight: '600', 
            fontSize: '1.2rem',
            letterSpacing: '0.025em',
            backgroundColor: 'var(--border-primary)',
            color: '#f9fafb',
            '&:hover': {
                backgroundColor: '#2f4f0bff',
            }
        }
    };
    
    const settingsButtonProps = {
        variant: 'contained',
        sx: { 
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', 
            fontWeight: '600', 
            fontSize: '1.2rem',
            letterSpacing: '0.025em',
            backgroundColor: '#B53A16',
            color: '#f9fafb',
            '&:hover': {
                backgroundColor: '#991b1b'
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
                backgroundColor: 'var(--bg-secondary)', 
                boxShadow: '0 20px 40px var(--shadow)',
                border: '1px solid var(--border-secondary)',
                maxWidth: '600px',
                width: '90%'
            }}>
                <div className='flex items-center gap-4 mb-4'>
                    <h1 className='text-5xl select-none' style={{ 
                        color: 'var(--border-primary)',
                        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
                        fontWeight: '300',
                        letterSpacing: '0.05em',
                        textShadow: '0 2px 4px var(--shadow)'
                    }}>
                        bulutlar
                    </h1>
                </div>
                
                {/* Navigation buttons */}
                <div className='flex flex-col gap-4 w-full max-w-md'>
                    <Button size="large" fullWidth onClick={() => setActiveScreen('tabs')} {...primaryButtonProps}>
                        {t('all articles')}
                    </Button>
                    <Button size="large" fullWidth onClick={() => setActiveScreen('categories')} {...primaryButtonProps}>
                        {t('categories')}
                    </Button>
                    <Button size="large" fullWidth onClick={() => setActiveScreen('groups')} {...primaryButtonProps}>
                        {t('groups')}
                    </Button>
                    
                    <div className='grid grid-cols-2 gap-3 mt-2'>
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
                    
                    <Button size="large" fullWidth onClick={() => setActiveScreen('settings')} {...settingsButtonProps}>
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