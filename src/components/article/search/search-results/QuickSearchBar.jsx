import React, { useState, useContext, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { SearchContext } from '../../../../store/search-context.jsx';
import { AppContext } from '../../../../store/app-context.jsx';
import FormatButton from '../../../common/FormatButton.jsx';
import toastr from 'toastr';

const QuickSearchBar = () => {
    const [localSearchTerm, setLocalSearchTerm] = useState('');
    const searchInputRef = useRef(null);
    const { quickSearchTerm, setQuickSearchTerm } = useContext(SearchContext);
    const { translate: t } = useContext(AppContext);

    // Sync local search term with context on mount
    useEffect(() => {
        setLocalSearchTerm(quickSearchTerm || '');
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

    const clearQuickSearch = () => {
        setLocalSearchTerm('');
        setQuickSearchTerm('');
    };

    return (
        <div className='flex items-center bg-white border border-gray-300 rounded-lg shadow-sm min-w-60'>
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 ml-3" />
            <input
                ref={searchInputRef}
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                className='flex-1 p-2 border-none outline-none bg-transparent text-gray-700 placeholder-gray-400'
                onKeyDown={handleQuickSearchKeyDown}
                placeholder={t('quick search')}
            />
            {localSearchTerm && (
                <div className='flex items-center'>
                    <FormatButton onClick={clearQuickSearch} title={t('clear search')}>
                        <XMarkIcon className="w-4 h-4 text-gray-400" />
                    </FormatButton>
                </div>
            )}
        </div>
    );
};

export default QuickSearchBar;
