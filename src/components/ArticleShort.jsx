import parse from 'html-react-parser';
import TagButton from './TagButton';

export default function ArticleShort({article, handleClick}) {
    const numberOfTags = 3;
    const numberOfCharsForText = 50;
    return (
        <div onClick={() => handleClick(article.id)} className="rounded-md gap-x-1.5 bg-stone-200 hover:bg-stone-100 
        active:bg-stone-200 active:shadow-none max-w-4xl px-10 my-4 mx-4 py-6 shadow-xl cursor-pointer">
            <h2 className="text-2xl text-gray-700 font-bold hover:text-gray-600">{article.title}</h2>
            <h3>{article.owner + '  -  ' + article.date + ' (' + article.number + ')'}</h3>
            <article className='my-2'>
                {parse(article.text.substring(0, numberOfCharsForText) + '...')}
            </article>
            {/* <div>
                {article.tags.slice(0, numberOfTags).map(tag => <TagButton key={Math.random()}>{tag}</TagButton>)}
                {article.tags.length > numberOfTags ? <h4 className='inline-block'>...</h4> : undefined}
            </div> */}
        </div>
    );
}