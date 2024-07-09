import React, { useState } from 'react';
import TagList from '../components/TagList';
import AddLinkModal from '../components/AddLinkModal';

import { updateArticle } from '../backend-adapter/BackendAdapter';

const ReadControls = ({ allTags, article, syncWithDB, addLink }) => {

    const [isLinkModalOpen, setLinkModalOpen] = useState(false);

    const handleTagsChanged = async (newTags) => {
        article.tags = newTags;
        await updateArticle(article.id, article);
        syncWithDB();
    }

    return (
        <div className='overflow-auto bg-stone-50'>
            <div className='p-2'>
                <TagList allTags={allTags} selectedTags={article.tags} onTagsChange={handleTagsChanged}></TagList>
            </div>
            <div>
                <button onClick={()=>setLinkModalOpen(true)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 mx-2 rounded focus:outline-none focus:shadow-outline">Add Link</button>
            </div>
            <AddLinkModal
                isOpen={isLinkModalOpen}
                onClose={() => setLinkModalOpen(false)}
                onAddLink={addLink}
            />
        </div>
    );
};

export default ReadControls;
