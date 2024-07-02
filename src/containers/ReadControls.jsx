import React from 'react';
import TagList from '../components/TagList';

import { updateArticle } from '../backend-adapter/BackendAdapter';

const ReadControls = ({ allTags, article }) => {

    const handleTagsChanged = async (newTags) => {
        article.tags = newTags;
        await updateArticle(article.id, article);
    }

    return (
        <div className='overflow-auto bg-stone-50'>
            <div className='p-2'>
                <TagList allTags={allTags} selectedTags={article.tags} onTagsChange={handleTagsChanged}></TagList>
            </div>
        </div>
    );
};

export default ReadControls;
