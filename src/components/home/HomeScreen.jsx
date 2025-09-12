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
        color: 'primary',
        style: { 
            fontFamily: '"Trebuchet MS", sans-serif', 
            fontWeight: 'bold', 
            fontSize: '1.2rem',
            backgroundColor: 'var(--button-bg)',
            color: 'var(--text-primary)',
            '&:hover': {
                backgroundColor: 'var(--button-hover)'
            }
        }
    };
    const secondaryButtonProps = {
        variant: 'outlined',
        color: 'primary',
        style: { 
            fontFamily: '"Trebuchet MS", sans-serif', 
            fontWeight: 'bold', 
            fontSize: '1.2rem',
            borderColor: 'var(--border-primary)',
            color: 'var(--text-primary)',
            '&:hover': {
                backgroundColor: 'var(--button-hover)',
                borderColor: 'var(--border-primary)'
            }
        }
    };

    return (
        <div className='relative flex w-full h-full' style={{ fontFamily: '"Trebuchet MS", sans-serif' }}>
            {/* Theme toggle button in top-right corner */}
            <div className='absolute top-4 right-4 z-10'>
                <ThemeToggle />
            </div>
            <div className='relative flex w-full h-full'>
                <div className='w-3/4'></div>
                <div className='flex flex-col flex-shrink-0 items-center justify-center gap-5 px-20 py-10' style={{ backgroundColor: 'var(--bg-secondary)', opacity: 0.95 }}>
                    <h1 className='text-6xl pb-10 select-none' style={{ color: 'var(--border-primary)' }}>bulutlar</h1>
                    <div className='flex flex-col gap-3'>
                        <Button size="large" onClick={() => setActiveScreen('tabs')} {...primaryButtonProps}>{t('all articles')}</Button>
                        <Button size="large" onClick={() => setActiveScreen('categories')} {...primaryButtonProps}>{t('categories')}</Button>
                        <Button size="large" onClick={() => setActiveScreen('groups')} {...primaryButtonProps}>{t('groups')}</Button>
                        <div className='flex flex-row gap-3 min-w-full'>
                            <div className='flex flex-col gap-3'>
                                <Button size="large" onClick={() => setActiveScreen('owners')} {...secondaryButtonProps}>{t('owners')}</Button>
                                <Button size="large" onClick={() => setActiveScreen('tags')} {...secondaryButtonProps}>{t('tags')}</Button>
                            </div>
                            <div className='flex flex-col gap-3'>
                                <Button size="large" onClick={() => setActiveScreen('annotations')} {...secondaryButtonProps}>{t('annotations')}</Button>
                                <Button size="large" onClick={() => setActiveScreen('quotes')} {...secondaryButtonProps}>{t('quotes')}</Button>
                            </div>
                        </div>
                        <Button size="large" onClick={() => setActiveScreen('settings')} {...secondaryButtonProps}>{t('settings')}</Button>
                    </div>
                    <div>
                        <h2 className='text-l' style={{ color: 'var(--text-secondary)' }}>db version: {dbVersion}</h2>
                    </div>
                    <div>
                        <h2 className='text-l' style={{ color: 'var(--text-secondary)' }}>app version: {packageJson.version}</h2>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeScreen;