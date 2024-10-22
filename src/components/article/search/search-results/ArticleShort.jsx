import parse from 'html-react-parser';
import TagButton from '../../../tag/TagButton';
import React, { useContext, useState } from 'react';
import { DBContext } from '../../../../store/db-context';
import ArticleInfo from '../../ArticleInfo';

export default function ArticleShort({ article, keywords, handleClick }) {

    const [isSelected, setIsSelected] = useState(false);
    const { getCategoryById, getTagById, getOwnerById } = useContext(DBContext);

    const numberOfTags = 3;
    const numberOfCharsForText = 400;

    const category = getCategoryById(article.categoryId);
    const owner = getOwnerById(article.ownerId);

    const normalizeText = (text) => {
        return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    };

    const highlightKeywords = (text, keywords) => {
        const normalizedText = normalizeText(text);
        let highlightedText = text;
        const matches = [];

        keywords.forEach(keyword => {
            const normalizedKeyword = normalizeText(keyword);
            const regex = new RegExp(`(${normalizedKeyword})`, 'gi');
            let match;
            while ((match = regex.exec(normalizedText)) !== null) {
                matches.push({ start: match.index, end: regex.lastIndex });
            }
        });

        // Sort matches by start position
        matches.sort((a, b) => a.start - b.start);

        // Highlight the original text based on matches
        let offset = 0;
        matches.forEach(({ start, end }) => {
            const originalStart = start + offset;
            const originalEnd = end + offset;
            highlightedText = highlightedText.slice(0, originalStart) + '<mark>' + highlightedText.slice(originalStart, originalEnd) + '</mark>' + highlightedText.slice(originalEnd);
            offset += '<mark>'.length + '</mark>'.length;
        });

        return highlightedText;
    };

    const handleCheckboxChange = () => {
        setIsSelected(!isSelected);
    };

    // const getHighlightedArticle = () => {


    // if (keywords) {        
    //         const highlightedTitle = highlightKeywords(article.title, keywords);
    //         const highlightedText = highlightKeywords(article.text, keywords);
    //         const highlightedExplanation = highlightKeywords(article.explanation, keywords);
    //         const highlightedComments = article.comments.map(comment => ({
    //             ...comment,
    //             text: highlightKeywords(comment.text, keywords)
    //         }));
    // }

    return (
        <div className="rounded-md bg-gray-100 hover:bg-white border-4
        active:bg-gray-300 active:shadow-none pl-2 pr-10 py-6 shadow-xl cursor-pointer flex flex-row w-full overflow-hidden"
            style={{ borderColor: category && category.color }}
        >
            <div className='min-h-full flex items-center px-3 cursor-normal' onClick={handleCheckboxChange}>
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={handleCheckboxChange}
                    className="form-checkbox h-6 w-6 text-blue-600 mr-2"
                />
            </div>
            <div className='flex flex-1 flex-col overflow-hidden' onClick={(e) => handleClick(e, article.id)} >
                <h2 className="text-2xl text-gray-700 font-bold hover:text-gray-600 break-words">{article.title}</h2>
                <ArticleInfo article={article} isEditable={false} />
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
