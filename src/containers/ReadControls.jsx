import React, { useState } from 'react';
import TagList from '../components/TagList';
import AddLinkModal from '../components/AddLinkModal';
import { updateArticle } from '../backend-adapter/BackendAdapter';

import { LinkIcon } from '@heroicons/react/24/outline';




const ReadControls = ({ allTags, article, syncWithDB, onAddLink, onToggleBold, onToggleUnderline }) => {

    const [isLinkModalOpen, setLinkModalOpen] = useState(false);

    const handleTagsChanged = async (newTags) => {
        article.tags = newTags;
        await updateArticle(article.id, article);
        syncWithDB();
    }

    return (
        <div className='overflow-auto bg-stone-50'>
            <div className='p-2'>
                <button onClick={() => setLinkModalOpen(true)} className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-2 mx-1 rounded focus:outline-none focus:shadow-outline">
                    <LinkIcon className="w-4 h-4" />
                </button>
                <button onClick={onToggleBold} className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-2 mx-1 rounded focus:outline-none focus:shadow-outline">
                    <strong>B</strong>
                </button>
                <button onClick={onToggleUnderline} className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-2 mx- rounded focus:outline-none focus:shadow-outline">
                    <u>U</u>
                </button>
            </div>
            <div className='p-2'>
                <TagList allTags={allTags} selectedTags={article.tags} onTagsChange={handleTagsChanged}></TagList>
            </div>
            <AddLinkModal
                isOpen={isLinkModalOpen}
                onClose={() => setLinkModalOpen(false)}
                onAddLink={onAddLink}
            />
        </div>
    );
};

export default ReadControls;