import React, { useContext } from 'react';
import TagList from '../../components/TagList.jsx' 
import { updateArticle } from '../../backend-adapter/BackendAdapter.js';
import { ReadContext } from '../../store/read-context.jsx';
import { AppContext } from '../../store/app-context.jsx';

const ReadSidePanel = () => {

    const { article } = useContext(ReadContext);
    const { syncWithDB } = useContext(AppContext);

    const handleTagsChanged = async (newTags) => {
        article.tags = newTags;
        await updateArticle(article.id, article);
        syncWithDB();
    }

    return (
        <div className='p-2'>
            <TagList selectedTags={article.tags} onTagsChange={handleTagsChanged}></TagList>
        </div>
    );
}

export default ReadSidePanel;