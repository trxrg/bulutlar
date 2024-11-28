import React, { useContext } from 'react';
import { DBContext } from '../../../../store/db-context';

const RelatedArticleCard = ({ article, onClick }) => {

    const { getCategoryByArticleId } = useContext(DBContext);
    const category = getCategoryByArticleId(article.id);

    const handleClick = () => {
        onClick(article.id);
    }

    return (
        <div className='rounded-md bg-gray-100 hover:bg-white border-4
        active:bg-gray-300 active:shadow-none shadow-xl cursor-pointer flex flex-row w-full overflow-hidden'
            style={{ borderColor: category && category.color }} onClick={handleClick}>
            <h2 className="text-xl text-gray-700 hover:text-gray-600 break-words px-2">{article.title}</h2>
        </div>
    );
};

export default RelatedArticleCard;
