import React, { useState, useEffect } from 'react';
import { addArticle, getAllOwners, updateArticle } from '../backend-adapter/BackendAdapter';
import OwnerList from './OwnerList';

const AddArticle = () => {
  const [title, setTitle] = useState('');
  const [explanation, setExplanation] = useState('');
  const [mainText, setMainText] = useState('');
  const [comment, setComment] = useState('');
  const [owner, setOwner] = useState('');
  const [tags, setTags] = useState([]);
  const [owners, setOwners] = useState([]);

  useEffect(() => {
    // Logic to execute after component initialization
    console.log('Component initialized');
    getOwners();
  }, []);

  const getOwners = async () => {
    try {
        const response = await getAllOwners();
        setOwners(response.map((owner) => owner.name));        
      } catch (err) {
        console.error(err);
      }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const result = await addArticle({
            title: title,
            order: 1,
            date: Date(),
            number: 2,
            explanation: explanation,
            text: mainText,
            comment: comment,
            owner: owner,
            tags: tags
        });
        console.log(result);
    } catch (err) {
        console.error(err.message);
    }

    // Reset form fields after submission
    setTitle('');
    setExplanation('');
    setMainText('');
    setComment('');
    setTags('');
    setOwner('');
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto mt-8 p-6 bg-gray-100 shadow-md rounded-lg">
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2" htmlFor="title">Title:</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>
      <OwnerList owners={owners} onOwnerChange={setOwner}></OwnerList>
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2" htmlFor="explanation">Explanation:</label>
        <textarea
          id="explanation"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          required
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-40 resize-y"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2" htmlFor="mainText">Main Text:</label>
        <textarea
          id="mainText"
          value={mainText}
          onChange={(e) => setMainText(e.target.value)}
          required
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-64 resize-y"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2" htmlFor="comment">Comment:</label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-40 resize-y"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2" htmlFor="comment">Tags:</label>
        <textarea
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value.split(/\s*,\s*/))}
          required
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-40 resize-y"
        />
      </div>
      <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
        Submit
      </button>
    </form>
  );
};

export default AddArticle;