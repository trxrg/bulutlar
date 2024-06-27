import React, { useEffect } from 'react';
import { PencilIcon } from '@heroicons/react/24/outline';
import '../styles.css';

const ArticleRead = ({ article, onEditClicked, onLinkClicked }) => {

  const { title, category, owner, date, number, explanation, text, comments, tags } = article;

  const handleEditClicked = (article) => {
    onEditClicked(article);
  }

  const handleLinkClicked = (event) => {
    event.preventDefault(); // Prevent default link behavior
    onLinkClicked(parseInt(event.target.getAttribute('href')));
  };


  useEffect(() => {
    const handleLinkClick = (event) => {
      // Check if the clicked element is an anchor tag within the component
      if (event.target.tagName.toLowerCase() === 'a') {
        handleLinkClicked(event);
      }
    };

    // Attach event listener to the component's container
    const containers = document.getElementsByClassName('articleRead');
    Array.from(containers).forEach(container => {
      container.addEventListener('click', handleLinkClick);
    });

    // Clean up the event listener
    return () => {
      Array.from(containers).forEach(container => {
        container.removeEventListener('click', handleLinkClick);
      });
    };
  }, []); // Empty dependency array ensures useEffect runs only once

  return (
    <div className="max-h-full overflow-auto mx-auto bg-white shadow-md rounded-lg mb-8">
      <div className="p-6">
        <div className='flex justify-between'>
          <h2 className="text-3xl font-semibold text-gray-800">{title}</h2>
          <button
            className="flex items-center bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={() => handleEditClicked(article)}
          >
            <PencilIcon className="w-4 h-4 mr-2" /> {/* Pencil icon */}
            Edit
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">{owner && owner.name + " | "} {new Date(date).toLocaleDateString('tr')} ({number})</p>
        {/* <p className="text-gray-700 mt-4">{text}</p> */}
        <div id="articleRead" className="articleRead prose text-gray-700 mt-4" dangerouslySetInnerHTML={{ __html: explanation }} />
        <div className='bg-green-100'>
          <h3 className="text-xl font-semibold my-4">Tags</h3>
          <div className="flex flex-wrap">
            {tags.map((tag, index) => (
              <span key={index} className="bg-gray-200 text-gray-800 rounded-full px-3 py-1 text-sm font-semibold mr-2 mb-2">{tag.name}</span>
            ))}
          </div>
        </div>
        <div id="articleRead" class="articleRead" className="articleRead prose text-gray-700 mt-4" dangerouslySetInnerHTML={{ __html: text }} />
      </div>

      <div className="p-6 bg-gray-100 border-t border-gray-200">
        <h3 className="text-xl font-semibold mb-4">{comments.size > 1 ? "Comments" : "Comment"}</h3>
        <ul className="divide-y divide-gray-200">
          {comments.map((comment, index) => (
            <li key={index} className="py-4">
              <div id="articleRead" className="articleRead prose text-gray-700 mt-4" dangerouslySetInnerHTML={{ __html: comment.text }} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ArticleRead;
