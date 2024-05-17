import { ARTICLES } from '../data/Articles'
import ArticleShort from './ArticleShort';

export default function SearchResult({ handleClick }) {
    return (
        <div>
            {ARTICLES.map(art => <ArticleShort handleClick={handleClick} key={art.id} article={art}></ArticleShort>)}
        </div>
    );
}