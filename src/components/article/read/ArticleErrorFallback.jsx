import React from 'react';
import { useTranslation } from 'react-i18next';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { articleApi } from '../../../backend-adapter/BackendAdapter';

const ArticleErrorFallback = ({ article, onDelete, onClose }) => {
    const { t } = useTranslation();

    const handleDeleteArticle = async () => {
        if (window.confirm(t('confirmDeleteArticle'))) {
            try {
                await articleApi.deleteArticle(article.id);
                onDelete(article.id);
            } catch (error) {
                console.error('Failed to delete article:', error);
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <ExclamationTriangleIcon className="w-16 h-16 mb-4" style={{ color: 'var(--text-error, #ef4444)' }} />
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {t('articleContentError')}
            </h2>
            <p className="mb-6 max-w-md" style={{ color: 'var(--text-secondary)' }}>
                {t('articleContentErrorDescription')}
            </p>
            <div className="flex gap-4">
                <button
                    onClick={handleDeleteArticle}
                    className="px-6 py-2 rounded-lg font-semibold transition-colors"
                    style={{ 
                        backgroundColor: 'var(--bg-error, #dc2626)', 
                        color: 'white' 
                    }}
                >
                    {t('delete article')}
                </button>
                <button
                    onClick={onClose}
                    className="px-6 py-2 rounded-lg font-semibold border-2 transition-colors"
                    style={{ 
                        borderColor: 'var(--border-primary)',
                        color: 'var(--text-primary)'
                    }}
                >
                    {t('closeTab')}
                </button>
            </div>
            {article && (
                <div className="mt-8 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    <p>{t('articleId')}: {article.id}</p>
                    <p>{t('articleTitle')}: {article.title || t('untitled')}</p>
                </div>
            )}
        </div>
    );
};

export default ArticleErrorFallback;

