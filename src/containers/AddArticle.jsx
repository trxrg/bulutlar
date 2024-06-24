import React, { useState, useEffect, useRef } from 'react';
import { addArticle, getAllOwners, getAllTags } from '../backend-adapter/BackendAdapter';
import OwnerList from '../components/OwnerList';
import TagList from '../components/TagList';
import RichText from '../components/RichText';

const AddArticle = () => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState();
  const [explanation, setExplanation] = useState('');
  const [mainText, setMainText] = useState('');
  const [comment, setComment] = useState('');
  const [owner, setOwner] = useState('');
  const [tags, setTags] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [owners, setOwners] = useState([]);

  const explanationRef = useRef();
  const mainTextRef = useRef();
  const commentRef = useRef();
  const tagsRef = useRef();
  const ownerRef = useRef();

  useEffect(() => {
    // Logic to execute after component initialization
    console.log('Component initialized');
    getOwners();
    getTags();
  }, []);

  const getOwners = async () => {
    try {
      const response = await getAllOwners();
      setOwners(response.map((owner) => owner.name));
    } catch (err) {
      console.error(err);
    }
  }

  const getTags = async () => {
    try {
      const response = await getAllTags();
      setAllTags(response.map((tag) => tag.name));
    } catch (err) {
      console.error(err);
    }
  }

  const handleTagsChange = (tags) => {
    setTags(tags);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await addArticle({
        title: title,
        order: 1,
        date: date,
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
    setDate('');

    ownerRef.current.reset();
    explanationRef.current.reset();
    mainTextRef.current.reset();
    commentRef.current.reset();
    tagsRef.current.reset();
  };

  return (
    <form onSubmit={handleSubmit} className="max-h-full overflow-auto mx-auto p-6 bg-gray-100 shadow-md rounded-lg">
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
      <OwnerList ref={ownerRef} owners={owners} onOwnerChange={setOwner}></OwnerList>
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2" htmlFor="explanation">Date:</label>
        <input
          type="date"
          id="dateInput"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className='border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring focus:border-blue-500'
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2" htmlFor="explanation">Explanation:</label>
        <RichText ref={explanationRef} readOnly={false} onTextChange={setExplanation} text={explanation}></RichText>
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2" htmlFor="mainText">Main Text:</label>
        <RichText ref={mainTextRef} readOnly={false} onTextChange={setMainText} text={mainText}></RichText>
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2" htmlFor="comment">Comment:</label>
        <RichText ref={commentRef} readOnly={false} onTextChange={setComment} text={comment}></RichText>
      </div>
      <TagList ref={tagsRef} allTags={allTags} onTagsChange={handleTagsChange}></TagList>
      <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 my-2 rounded focus:outline-none focus:shadow-outline">
        Submit
      </button>
    </form>
  );
};

export default AddArticle;
