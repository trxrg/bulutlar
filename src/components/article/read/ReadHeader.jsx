import React, { useContext } from 'react';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { ReadContext } from '../../../store/read-context.jsx';
import { DBContext } from '../../../store/db-context.jsx';
import { AppContext } from '../../../store/app-context.jsx';
import RichInput from '../../common/RichInput.jsx';
import { articleApi } from '../../../backend-adapter/BackendAdapter.js';
import ArticleInfo from '../ArticleInfo.jsx';

const ReadHeader = () => {
  const { article, syncArticleFromBE, getOwnerName, getCategoryName } = useContext(ReadContext);
  const { fullScreen, translate: t } = useContext(AppContext);
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

  const handleIsReadClick = async (e) => {
    e.stopPropagation();
    await articleApi.setIsRead(article.id, !article.isRead);
    fetchArticleById(article.id);
  }

  return (
    <div 
      className={fullScreen ? 'hidden' : 'pt-2 pb-1 flex justify-between border-b-4'}
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-primary)'
      }}
    >
      <div className='px-4'>
        <RichInput 
          initialText={article.title} 
          handleSave={(newName) => handleChangeTitle(newName)} 
          className="text-2xl font-semibold mb-1"
          style={{ color: 'var(--text-primary)' }}
        ></RichInput>
        <ArticleInfo article={article}></ArticleInfo>
      </div>
      <div className='flex items-center gap-3 pr-6'>
        <div onClick={handleStarClick} className='cursor-pointer' title={t('starred')}>
          {article.isStarred ? (
            <StarIcon style={{ fontSize: '2rem', color: '#FFD700' }} className="hover:scale-125" />
          ) : (
            <StarBorderIcon style={{ fontSize: '2rem', color: '#B0B0B0' }} className="hover:scale-125" />
          )}
        </div>
        <div onClick={handleIsReadClick} className='cursor-pointer' title={article.isRead ? t('mark as unread') : t('mark as read')}>
          {article.isRead ? (
            <CheckCircleIcon style={{ fontSize: '2rem', color: '#4CAF50' }} className="hover:scale-125" />
          ) : (
            <CheckCircleOutlineIcon style={{ fontSize: '2rem', color: '#B0B0B0' }} className="hover:scale-125" />
          )}
        </div>
      </div>
    </div>
  );
}

export default ReadHeader;
