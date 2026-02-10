import React, { useState, useContext, useEffect } from 'react';
import GeneralModal from '../common/GeneralModal';
import ActionButton from '../common/ActionButton';
import { AppContext } from '../../store/app-context';
import { DBContext } from '../../store/db-context';

const AdvancedExportDialog = ({ isOpen, onClose, onExport }) => {
    const { translate: t } = useContext(AppContext);
    const { allCategories } = useContext(DBContext);
    
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [includeNotes, setIncludeNotes] = useState(true);
    const [includeQuotes, setIncludeQuotes] = useState(true);
    const [includeTags, setIncludeTags] = useState(true);
    const [includeGroups, setIncludeGroups] = useState(true);
    const [includeRelatedArticles, setIncludeRelatedArticles] = useState(true);
    const [includeRichEdits, setIncludeRichEdits] = useState(true);

    useEffect(() => {
        if (isOpen && allCategories) {
            // Select all categories by default
            setSelectedCategories(allCategories.map(c => c.id));
        }
    }, [isOpen, allCategories]);

    const handleCategoryToggle = (categoryId) => {
        setSelectedCategories(prev => {
            if (prev.includes(categoryId)) {
                return prev.filter(id => id !== categoryId);
            } else {
                return [...prev, categoryId];
            }
        });
    };

    const handleSelectAllCategories = () => {
        setSelectedCategories(allCategories.map(c => c.id));
    };

    const handleDeselectAllCategories = () => {
        setSelectedCategories([]);
    };

    const handleExport = () => {
        const options = {
            selectedCategories,
            includeNotes,
            includeQuotes,
            includeTags,
            includeGroups,
            includeRelatedArticles,
            includeRichEdits,
        };
        onExport(options);
        onClose();
    };

    return (
        <GeneralModal
            isOpen={isOpen}
            onRequestClose={onClose}
            title={t('advanced export')}
            style={{ maxHeight: '80%', overflowY: 'auto' }}
        >
            <div className="flex flex-col gap-4">
                {/* Categories Section */}
                <div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-3">
                        {t('categories')}
                    </h3>
                    <div className="flex gap-2 mb-3">
                        <ActionButton onClick={handleSelectAllCategories} size="small">
                            {t('select all')}
                        </ActionButton>
                        <ActionButton onClick={handleDeselectAllCategories} color="gray" size="small">
                            {t('deselect all')}
                        </ActionButton>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {allCategories && allCategories.map(category => (
                            <button
                                key={category.id}
                                onClick={() => handleCategoryToggle(category.id)}
                                className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer"
                                style={{
                                    backgroundColor: selectedCategories.includes(category.id) 
                                        ? category.color || '#059669'
                                        : '#e5e7eb',
                                    color: selectedCategories.includes(category.id) ? '#ffffff' : '#374151',
                                    border: selectedCategories.includes(category.id) 
                                        ? `2px solid ${category.color || '#059669'}`
                                        : '2px solid transparent',
                                    opacity: selectedCategories.includes(category.id) ? 1 : 0.6
                                }}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="border-t border-gray-300 my-2"></div>

                {/* Include Options */}
                <div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-3">
                        {t('include in export')}
                    </h3>
                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={includeNotes}
                                onChange={(e) => setIncludeNotes(e.target.checked)}
                                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                            />
                            <span className="text-gray-700">{t('notes')}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={includeQuotes}
                                onChange={(e) => setIncludeQuotes(e.target.checked)}
                                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                            />
                            <span className="text-gray-700">{t('quotes')}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={includeTags}
                                onChange={(e) => setIncludeTags(e.target.checked)}
                                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                            />
                            <span className="text-gray-700">{t('tags')}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={includeGroups}
                                onChange={(e) => setIncludeGroups(e.target.checked)}
                                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                            />
                            <span className="text-gray-700">{t('groups')}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={includeRelatedArticles}
                                onChange={(e) => setIncludeRelatedArticles(e.target.checked)}
                                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                            />
                            <span className="text-gray-700">{t('related articles')}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={includeRichEdits}
                                onChange={(e) => setIncludeRichEdits(e.target.checked)}
                                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                            />
                            <span className="text-gray-700">{t('rich text formatting')}</span>
                        </label>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-300">
                    <ActionButton onClick={onClose} color="red">
                        {t('cancel')}
                    </ActionButton>
                    <ActionButton 
                        onClick={handleExport} 
                        color="green"
                        disabled={selectedCategories.length === 0}
                    >
                        {t('export')}
                    </ActionButton>
                </div>
            </div>
        </GeneralModal>
    );
};

export default AdvancedExportDialog;

