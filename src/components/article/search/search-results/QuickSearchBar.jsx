import React, { useState, useContext, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { SearchContext } from '../../../../store/search-context.jsx';
import { AppContext } from '../../../../store/app-context.jsx';
import FormatButton from '../../../common/FormatButton.jsx';
import toastr from 'toastr';

const QuickSearchBar = () => {
    const [localSearchTerm, setLocalSearchTerm] = useState('');
    const searchInputRef = useRef(null);
    const { quickSearchTerm, setQuickSearchTerm } = useContext(SearchContext);
    const { translate: t } = useContext(AppContext);

    // Sync local search term with context on mount and when quickSearchTerm changes from external source
    useEffect(() => {
        // Only sync if quickSearchTerm is not empty (to avoid clearing input when we clear search results)
        if (quickSearchTerm) {
            setLocalSearchTerm(quickSearchTerm);
        }
    }, [quickSearchTerm]);

    // Add keyboard shortcut for focusing search bar
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Check for Ctrl+F (Windows/Linux) or Cmd+F (Mac)
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const handleQuickSearch = () => {
        if (!localSearchTerm.trim()) {
            setQuickSearchTerm('');
            return;
        }

        const trimmed = localSearchTerm.trim();
        if (trimmed.length >= 2) {
            setQuickSearchTerm(trimmed);
        } else {
            toastr.warning(t('enter at least 2 characters'));
        }
    };

    const handleQuickSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleQuickSearch();
        } else if (e.key === 'Escape') {
            clearQuickSearch();
        }
    };

    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setLocalSearchTerm(newValue);

        // Reset search results when user starts typing (but keep the input value)
        if (quickSearchTerm) {
            setQuickSearchTerm('');
        }
    };

    const clearQuickSearch = () => {
        setLocalSearchTerm('');
        setQuickSearchTerm('');
    };

    return (
        <div className='flex items-center rounded-lg shadow-sm min-w-60'
            style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-secondary)',
                borderRadius: '0.25rem',
                padding: '0.25rem'
            }}>
            <div className="flex items-center ml-3">
                <MagnifyingGlassIcon className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
                <CheckIcon
                    className={`w-4 h-4 ml-1 transition-opacity duration-200 ${quickSearchTerm ? 'opacity-100' : 'opacity-0'}`}
                    style={{ color: 'var(--success-color, #22c55e)' }}
                    title={quickSearchTerm ? t('search completed') : ''}
                />
            </div>
            <input
                ref={searchInputRef}
                value={localSearchTerm}
                onChange={handleInputChange}
                className='flex-1 p-2 border-none outline-none bg-transparent'
                style={{
                    color: 'var(--text-primary)'
                }}
                onKeyDown={handleQuickSearchKeyDown}
                placeholder={t('quick search')}
            />
            {localSearchTerm && (
                <div className='flex items-center'>
                    <FormatButton onClick={clearQuickSearch} title={t('clear search')}>
                        <XMarkIcon className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                    </FormatButton>
                </div>
            )}
        </div>
    );
};

export default QuickSearchBar;
