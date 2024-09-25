import React, { useState, useEffect, useRef, useContext } from 'react';
import { format } from 'date-fns';
import { addArticle, updateArticle, deleteArticle, getAllCategories } from '../../backend-adapter/BackendAdapter.js';
import OwnerList from './OwnerList.jsx';
import TagList from './TagList.jsx';
import RichText from './RichText.jsx';
import CategoryList from './CategoryList.jsx';
import { AppContext } from '../../store/app-context.jsx'
import CustomSelect from './CustomSelect.jsx';

const AddArticle = () => {

  const { editedArticle, allTags, allOwners, afterSubmitArticle, afterDeleteArticle } = useContext(AppContext);

  const [dispTitle, setDispTitle] = useState(editedArticle ? editedArticle.title : '');
  const [dispDate, setDispDate] = useState(editedArticle ? new Date(editedArticle.date) : new Date());
  const [dispExplanation, setDispExplanation] = useState(editedArticle ? editedArticle.explanation : '');
  const [dispMainText, setDispMainText] = useState(editedArticle ? editedArticle.text : '');
  const [dispCommentText, setDispCommentText] = useState(editedArticle && editedArticle.comments[0] ? editedArticle.comments[0].text : '');
  const [dispOwnerName, setDispOwnerName] = useState(editedArticle ? editedArticle.owner.name : '')
  const [dispCategoryName, setDispCategoryName] = useState(editedArticle ? editedArticle.category.name : '');
  const [dispTags, setDispTags] = useState(editedArticle ? editedArticle.tags : []);
  const [allCategories, setAllCategories] = useState([]);

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
      const response = await getAllCategories();
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
      let result;
      if (editedArticle) {
        result = await updateArticle(editedArticle.id, {
          title: dispTitle,
          date: dispDate,
          explanation: dispExplanation,
          text: dispMainText,
          owner: { name: dispOwnerName },
          category: { name: dispCategoryName },
          comments: [{ text: dispCommentText }],
          tags: dispTags
        });
        console.log('article updated:');
        console.log(result);
        // article = result;
      } else {
        result = await addArticle({
          title: dispTitle,
          date: dispDate,
          explanation: dispExplanation,
          text: dispMainText,
          owner: { name: dispOwnerName },
          category: { name: dispCategoryName },
          comments: [{ text: dispCommentText }],
          tags: dispTags
        });
        console.log('article added:');
        console.log(result);
      }

      afterSubmitArticle(result.id);
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleDeleteArticle = async () => {
    const articleId = editedArticle.id;
    await deleteArticle(articleId);
    afterDeleteArticle(articleId);
  }

  return (
    <div className='max-h-full overflow-auto'>
      <form onSubmit={handleSubmit} className="mx-auto p-6 bg-stone-50 shadow-md rounded-lg">
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
        <CategoryList showNewButton={true} onCategoryChange={setDispCategoryName}></CategoryList>
        <CustomSelect></CustomSelect>
        <OwnerList ref={ownerRef} owners={allOwners} selectedOwner={dispOwnerName} onOwnerChange={setDispOwnerName}></OwnerList>
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
        <TagList ref={tagsRef} allTags={allTags} selectedTags={dispTags} onTagsChange={handleTagsChange}></TagList>
        <div className='flex justify-between'>
          <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 my-2 rounded focus:outline-none focus:shadow-outline">
            {editedArticle ? "Save" : "Submit"}
          </button>

        </div>
      </form>
      <div className='flex justify-end mx-2'>
        {editedArticle && <button type="button" onClick={handleDeleteArticle} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 my-2 rounded focus:outline-none focus:shadow-outline">
          Delete Article
        </button>
        }
      </div>
    </div>
  );
};

export default AddArticle;
