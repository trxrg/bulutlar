import parse from 'html-react-parser';
import TagButton from './TagButton';

export default function ArticleShort({ article, handleClick }) {
    const numberOfTags = 3;
    const numberOfCharsForText = 50;


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
        <div onClick={() => handleClick(article)} className="rounded-md bg-stone-200 hover:bg-stone-100 
        active:bg-stone-200 active:shadow-none px-10 my-4 mx-4 py-6 shadow-xl cursor-pointer">
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
    );
}
