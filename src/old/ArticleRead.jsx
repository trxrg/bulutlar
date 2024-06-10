import parse from 'html-react-parser';
import TagButton from '../components/TagButton';

export default function ArticleRead({ article }) {
    return (
        <div className="rounded-md gap-x-1.5 bg-green-50 px-10 my-4 mx-4 py-6 shadow-xl outline">
            <h2 className="text-2xl text-gray-700 font-bold hover:text-gray-600">{article.title}</h2>
            <h3>{article.owner}</h3>
            <h3>{article.date + ' (' + article.number + ')'}</h3>
            <article className='my-2'>
                {parse(article.text)}
            </article>
            <h3 className='text-xl font-bold my-2'>Yorum</h3>
            <article className='my-2'>
                {parse(article.comment)}
            </article>
            <h4 className='font-bold my-2'>Etiketler</h4>
            {/* <div>{article.tags.map(tag => <TagButton key={Math.random()}>{tag}</TagButton>)}</div> */}
        </div>
    );
}
