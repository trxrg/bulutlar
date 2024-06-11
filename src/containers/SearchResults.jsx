import ArticleShort from '../components/ArticleShort';

const SearchResults = ({ handleClick, articles }) => {
    return (
        <div>
            {articles.map(art => <ArticleShort handleClick={handleClick} key={art.id} article={art}></ArticleShort>)}
        </div>
    );
}

export default SearchResults;
