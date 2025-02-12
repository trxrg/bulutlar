import React, { useContext } from 'react';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { ReadContext } from '../../../store/read-context.jsx';
import { DBContext } from '../../../store/db-context.jsx';
import { AppContext } from '../../../store/app-context.jsx';
import RichInput from '../../common/RichInput.jsx';
import { articleApi } from '../../../backend-adapter/BackendAdapter.js';
import ArticleInfo from '../ArticleInfo.jsx';

const ReadHeader = () => {
  const { article, syncArticleFromBE, getOwnerName, getCategoryName } = useContext(ReadContext);
  const { fullScreen } = useContext(AppContext);
  const { fetchArticleById } = useContext(DBContext);


  const handleChangeTitle = async (newName) => {
    await articleApi.updateTitle(article.id, newName);
    syncArticleFromBE(article.id);
  }

  const handleStarClick = async (e) => {
    e.stopPropagation();
    await articleApi.setIsStarred(article.id, !article.isStarred);
    fetchArticleById(article.id);
  }

  return (
    <div className={fullScreen ? 'hidden' : 'bg-white pt-2 pb-1 flex justify-between border-b-4 border-[#809671]'}>
      <div className='px-6'>
        <RichInput initialText={article.title} handleSave={(newName) => handleChangeTitle(newName)} className="text-2xl font-semibold text-gray-800 mb-1"></RichInput>
        <ArticleInfo article={article}></ArticleInfo>
      </div>
      <div onClick={handleStarClick} className='flex items-center pr-6'>
        {article.isStarred ? (
          <StarIcon style={{ fontSize: '2rem', color: '#FFD700' }} className="hover:scale-125" />
        ) : (
          <StarBorderIcon style={{ fontSize: '2rem', color: '#B0B0B0' }} className="hover:scale-125" />
        )}
      </div>
    </div>
  );
}

export default ReadHeader;
