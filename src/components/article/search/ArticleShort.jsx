import parse from 'html-react-parser';
import TagButton from '../../tag/TagButton';
import React, { useContext } from 'react';
import { DBContext } from '../../../store/db-context';

export default function ArticleShort({ article, handleClick }) {

    const { getCategoryById, getTagById, getOwnerById } = useContext(DBContext);

    const numberOfTags = 3;
    const numberOfCharsForText = 150;

    const category = getCategoryById(article.categoryId);
    const owner = getOwnerById(article.ownerId);

    const getFormattedDate = (datestr) => {
        const date = new Date(datestr);

        const year = date.getFullYear();
        let month = date.getMonth() + 1;
        let day = date.getDate();

        if (month < 10)
            month = "0" + month;
        if (day < 10)
            day = "0" + day;

        const result = day + "." + month + "." + year;
        return result;
    }

    const getDayOfWeek = (datestr) => {
        const date = new Date(datestr);
        const weekdays = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
        return weekdays[date.getDay()];
    }

    return (
        <div className="rounded-md bg-gray-100 hover:bg-white border-4
        active:bg-gray-300 active:shadow-none px-10 my-4 mx-4 py-6 shadow-xl cursor-pointer"
            style={{ borderColor: category && category.color }}
        >
            <div onClick={() => handleClick(article.id)} >
                <h2 className="text-2xl text-gray-700 font-bold hover:text-gray-600">{article.title}</h2>
                <h3>{owner.name + '  |  ' + category.name + ' | ' + getFormattedDate(article.date) + ' ' + getDayOfWeek(article.date) + ' (' + article.number + ')'}</h3>
                <article className='my-2'>
                    {parse(article.text.substring(0, numberOfCharsForText) + '...')}
                </article>
                <div>
                    {article.tags.slice(0, numberOfTags).map(tag => {
                        const tagEntity = getTagById(tag.id);
                        <TagButton key={tag.id} isCloseable={false} label={tagEntity.name}>{tagEntity.name}</TagButton>
                    })}
                    {article.tags.length > numberOfTags ? <h4 className='inline-block'>...</h4> : undefined}
                </div>
            </div>
        </div >
    );
}
