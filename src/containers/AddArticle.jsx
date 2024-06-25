import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { addArticle, getAllOwners, getAllTags, getAllCategories } from '../backend-adapter/BackendAdapter';
import OwnerList from '../components/OwnerList';
import TagList from '../components/TagList';
import RichText from '../components/RichText';
import CategoryList from '../components/CategoryList';

const AddArticle = ({article}) => {
  const [dispTitle, setDispTitle] = useState(article ? article.title : '');
  const [dispDate, setDispDate] = useState(article ? new Date(article.date) : new Date());
  const [dispExplanation, setDispExplanation] = useState(article ? article.explanation : '');
  const [dispMainText, setDispMainText] = useState(article ? article.text : '');
  const [dispComment, setDispComment] = useState(article && article.comments[0] ? article.comments[0].text : '');
  const [dispOwner, setDispOwner] = useState(article ? article.owner.name : '');
  const [dispCategory, setDispCategory] = useState(article ? article.category : '');
  const [dispTags, setDispTags] = useState(article ? article.tags.map(tag => tag.name) : []);
  const [allTags, setAllTags] = useState([]);
  const [allOwners, setAllOwners] = useState([]);
  const [allCategories, setAllCategories] = useState([]);

  const explanationRef = useRef();
  const mainTextRef = useRef();
  const commentRef = useRef();
  const tagsRef = useRef();
  const ownerRef = useRef();
  const categoryRef = useRef();

  useEffect(() => {
    // Logic to execute after component initialization
    console.log('Component initialized');
    getOwners();
    getTags();
    getCategories();
  }, []);

  const getOwners = async () => {
    try {
      const response = await getAllOwners();
      setAllOwners(response.map((owner) => owner.name));
    } catch (err) {
      console.error(err);
    }
  }

  const getCategories = async () => {
    try {
      const response = await getAllCategories();
      setAllCategories(response.map((category) => category.name));
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
    setDispTags(tags);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await addArticle({
        title: dispTitle,
        order: 1,
        date: dispDate,
        number: 2,
        explanation: dispExplanation,
        text: dispMainText,
        owner: dispOwner,
        category: dispCategory,
        comments: [dispComment],
        tags: dispTags
      });
      console.log(result);
    } catch (err) {
      console.error(err.message);
    }

    // Reset form fields after submission
    setDispTitle('');
    setDispExplanation('');
    setDispMainText('');
    setDispComment('');
    setDispTags('');
    setDispOwner('');
    setDispDate('');

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
          value={dispTitle}
          onChange={(e) => setDispTitle(e.target.value)}
          required
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>
      <CategoryList ref={categoryRef} categories={allCategories} onCategoryChange={setDispCategory}></CategoryList>
      <OwnerList ref={ownerRef} owners={allOwners} onOwnerChange={setDispOwner}></OwnerList>
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2" htmlFor="explanation">Date:</label>
        <input
          type="date"
          id="dateInput"
          value={format(dispDate, 'yyyy-MM-dd')}
          onChange={(e) => setDispDate(e.target.value)}
          required
          className='border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring focus:border-blue-500'
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2" htmlFor="explanation">Explanation:</label>
        <RichText ref={explanationRef} readOnly={false} onTextChange={setDispExplanation} text={dispExplanation}></RichText>
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2" htmlFor="mainText">Main Text:</label>
        <RichText ref={mainTextRef} readOnly={false} onTextChange={setDispMainText} text={dispMainText}></RichText>
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2" htmlFor="comment">Comment:</label>
        <RichText ref={commentRef} readOnly={false} onTextChange={setDispComment} text={dispComment}></RichText>
      </div>
      <TagList ref={tagsRef} allTags={allTags} selectedTags={dispTags} onTagsChange={handleTagsChange}></TagList>
      <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 my-2 rounded focus:outline-none focus:shadow-outline">
        Submit
      </button>
    </form>
  );
};

export default AddArticle;
