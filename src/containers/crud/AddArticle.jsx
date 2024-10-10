import React, { useState, useEffect, useRef, useContext } from 'react';
import { format } from 'date-fns';
import { articleApi, categoryApi } from '../../backend-adapter/BackendAdapter.js';
import TagList from './TagList.jsx';
import RichText from './RichText.jsx';
import { AppContext } from '../../store/app-context.jsx'
import { DBContext } from '../../store/db-context.jsx';
import CategoryList from './CategoryList.jsx';
import OwnerList from './OwnerList.jsx';
import ImageUpload from './ImageUpdload.jsx';

const AddArticle = () => {

  const { afterSubmitArticle, afterDeleteArticle } = useContext(AppContext);
  const { allTags, allOwners, } = useContext(DBContext);

  const [dispTitle, setDispTitle] = useState('');
  const [dispDate, setDispDate] = useState(new Date());
  const [dispExplanation, setDispExplanation] = useState('');
  const [dispMainText, setDispMainText] = useState('');
  const [dispCommentText, setDispCommentText] = useState('');
  const [dispOwnerName, setDispOwnerName] = useState('')
  const [dispCategoryName, setDispCategoryName] = useState('');
  const [dispTags, setDispTags] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [images, setImages] = useState([]);

  const explanationRef = useRef();
  const mainTextRef = useRef();
  const commentRef = useRef();
  const tagsRef = useRef();
  const ownerRef = useRef();
  const categoryRef = useRef();

  useEffect(() => {
    // Logic to execute after component initialization
    getCategories();
  }, []);

  const getCategories = async () => {
    try {
      const response = await categoryApi.getAll();
      console.log('categories:');
      console.log(response);
      setAllCategories(response.map((category) => category.name));
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
      const result = await articleApi.create({
        title: dispTitle,
        date: dispDate,
        explanation: dispExplanation,
        text: dispMainText,
        owner: { name: dispOwnerName },
        category: { name: dispCategoryName },
        comments: [{ text: dispCommentText }],
        tags: dispTags,
        images: images
      });
      if (result.error) {
        console.error(result.error);
      } else {
        console.log('article added:');
        console.log(result);
      }

      afterSubmitArticle(result.id);
    } catch (err) {
      console.error(err.message);
    }
  };

  return (
    <div className='max-w-5xl w-full'>
      <form onSubmit={handleSubmit} className="mx-auto p-6 bg-stone-50 shadow-md">
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
        <CategoryList onCategoryChange={setDispCategoryName}></CategoryList>
        <OwnerList onOwnerChange={setDispOwnerName}></OwnerList>
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
          <RichText ref={explanationRef} onTextChange={setDispExplanation} text={dispExplanation}></RichText>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2" htmlFor="mainText">Main Text:</label>
          <RichText ref={mainTextRef} onTextChange={setDispMainText} text={dispMainText}></RichText>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2" htmlFor="comment">Comment:</label>
          <RichText ref={commentRef} onTextChange={setDispCommentText} text={dispCommentText}></RichText>
        </div>
        <div>
          <label className="block text-gray-700 font-bold mb-2">Images:</label>
          <ImageUpload images={images} setImages={setImages}></ImageUpload>
        </div>
        <TagList ref={tagsRef} allTags={allTags} selectedTags={dispTags} onTagsChange={handleTagsChange}></TagList>
        <div className='flex justify-between'>
          <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 my-2 rounded focus:outline-none focus:shadow-outline">
            Submit
          </button>

        </div>
      </form>      
    </div>
  );
};

export default AddArticle;
