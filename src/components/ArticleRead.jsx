import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import styles for react-quill
import 'react-quill/dist/quill.bubble.css'; // Optionally import bubble theme for react-quill
import 'react-quill/dist/quill.core.css'; // Import core styles for react-quill

const ArticleRead = ({ article }) => {
  const [isEditable, setIsEditable] = useState(false);

  const handleEditToggle = () => {
    setIsEditable(prevState => !prevState);
  };

  const handleSave = () => {
    console.log('save clicked');
  }

  const handleInputChange = (e, field) => {
    // Assuming you have a way to update the article object in parent component or state
    if (field === 'owner')
      article[field].name = e.target.value;
    else
      article[field] = e.target.value;
  };

  const handleTextChange = (value, field) => {
    article[field] = value;
  };

  return (
    <div className="max-w-3xl mx-auto p-6 border rounded-lg shadow-lg">
      <div className='flex justify-end'>
        {isEditable ?
          <>
            <button onClick={handleSave} className="ml-2 text-green-500 hover:text-green-700">Save</button>
            <button onClick={handleEditToggle} className="ml-2 text-red-500 hover:text-red-700">Cancel</button>
          </>
          :
          <button onClick={handleEditToggle} className="ml-2 text-blue-500 hover:text-blue-700">Edit</button>
        }
      </div>
      <div className="mb-4 flex justify-between border border-gray-400">
        {isEditable ? (
          <input type="text" value={article.title} onChange={(e) => handleInputChange(e, 'title')} className="w-full bg-white border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500" />
        ) : (
          <div>{article.title}</div>
        )}
      </div>

      <div className="mb-4 border border-red-400">
        {isEditable ? (
          <ReactQuill
            value={article.text}
            onChange={(value) => handleTextChange(value, 'text')}
            className="bg-white border-2 border-gray-300 rounded-lg"
            modules={{ toolbar: true }}
            theme="snow"
          />
        ) : (
          <div dangerouslySetInnerHTML={{ __html: article.text }} />
        )}
      </div>

      {/* <div>
                <label className="block text-gray-700 font-bold mb-2">Comments:</label>
                {editableFields.comments ? (
                    <ReactQuill
                        value={article.comments}
                        onChange={(value) => handleTextChange(value, 'comments')}
                        className="bg-white border-2 border-gray-300 rounded-lg"
                        modules={{ toolbar: true }}
                        theme="snow"
                    />
                ) : (
                    <div dangerouslySetInnerHTML={{ __html: article.comments }} />
                )}
                <button onClick={() => handleEditToggle('comments')} className="ml-2 text-blue-500 hover:text-blue-700">Edit</button>
            </div> */}
    </div>
  );
};

export default ArticleRead;
