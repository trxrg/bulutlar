import { useState } from 'react';

import parse from 'html-react-parser';
import TagButton from './TagButton';
import React from 'react';

export default function ArticleShort({ article, handleClick }) {
    const numberOfTags = 3;
    const numberOfCharsForText = 50;

    const [showCode, setShowCode] = useState(false);

    const toggleShowCode = () => {
        setShowCode(prev => !prev);
    }

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
        <div className="rounded-md bg-teal-200 hover:bg-teal-100 
        active:bg-blue-500 active:shadow-none px-10 my-4 mx-4 py-6 shadow-xl cursor-pointer">
            <div onClick={() => handleClick(article.id)} >
                <h2 className="text-2xl text-gray-700 font-bold hover:text-gray-600">{article.title}</h2>
                <h3>{article.owner.name + '  -  ' + getFormattedDate(article.date) + ' ' + getDayOfWeek(article.date) + ' (' + article.number + ')'}</h3>
                <article className='my-2'>
                    {parse(article.text.substring(0, numberOfCharsForText) + '...')}
                </article>
                <div>
                    {article.tags.slice(0, numberOfTags).map(tag => <TagButton key={Math.random()}>{tag.name}</TagButton>)}
                    {article.tags.length > numberOfTags ? <h4 className='inline-block'>...</h4> : undefined}
                </div>
            </div>
            <div>
                <h2 className='hover:text-gray-500' onClick={(toggleShowCode)}>{showCode ? 'Hide' : 'Show'} Code</h2>
                {showCode && <h2>{article.code}</h2>}
            </div>
        </div>
    );
}
