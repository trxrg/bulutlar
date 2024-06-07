import React from 'react';

const ArticleView = ({article}) => {
  return (
    <div className="article max-w-3xl mx-auto p-4 bg-white shadow-md rounded-md">
      <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
      <p className="text-gray-700"><strong>Author:</strong> {article.ownerId}</p>
      {/* <p className="text-gray-700"><strong>Date:</strong> {article.date}</p> */}
      <p className="text-gray-700"><strong>Short Explanation:</strong> {article.explanation}</p>
      <div className="main-text mt-4 text-gray-800">{article.text}</div>
      <div className="comment-section mt-8">
        <h2 className="text-2xl font-semibold mb-2">Comments</h2>
        <p className="text-gray-800">{article.comment}</p>
      </div>
    </div>
  );
}

export default ArticleView;
