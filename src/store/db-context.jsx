import { createContext, useState, useEffect } from 'react';
import { ownerApi, categoryApi, articleApi, imageApi } from '../backend-adapter/BackendAdapter';

export const DBContext = createContext(

);

export default function DBContextProvider({ children }) {
    const [allArticles, setAllArticles] = useState([]);
    const [allOwners, setAllOwners] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [allComments, setAllComments] = useState([]);
    const [allImageInfos, setAllImageInfos] = useState([]);
    
    const fethArticleById = async (id) => {
        try {
            const updatedArticle = await articleApi.getById(id);

            console.log('updated article')
            console.log(updatedArticle)

            const updatedArticles = allArticles.map(article => article.id === id ? updatedArticle : article);
            setAllArticles(updatedArticles);
        } catch (err) {
            console.error(err);
        }
    }

    const fetchCategoryById = async (id) => {
        try {
            const updatedCategory = await categoryApi.getById(id);

            console.log('updated category')
            console.log(updatedCategory)

            const updatedCategories = allCategories.map(category => category.id === id ? updatedCategory : category);
            setAllCategories(updatedCategories);
        } catch (err) {
            console.error(err);
        }
    }

    const fetchOwnerById = async (id) => {
        try {
            const updatedOwner = await ownerApi.getById(id);

            console.log('updated owner')
            console.log(updatedOwner)

            const updatedOwners = allOwners.map(owner => owner.id === id ? updatedOwner : owner);
            setAllOwners(updatedOwners);
        } catch (err) {
            console.error(err);
        }
    }

    const fetchCommentById = async (id) => {
        try {
            const updatedComment = await commentApi.getById(id);

            console.log('updated comment')
            console.log(updatedComment)

            const updatedComments = allComments.map(comment => comment.id === id ? updatedComment : comment);
            setAllComments(updatedComments);
        } catch (err) {
            console.error(err);
        }
    }

    const fetchImageInfoById = async (id) => {       
        try {
            const updatedImageInfo = await imageApi.getInfoById(id);

            console.log('updated image')
            console.log(updatedImageInfo)

            const updatedImageInfos = allImageInfos.map(image => image.id === id ? updatedImageInfo : image);
            setAllImageInfos(updatedImageInfos);
        } catch (err) {
            console.error(err);
        }
    }

    const fetchAllArticles = async () => {
        try {
            const response = await getAllArticles();
            setAllArticles(response);
        } catch (err) {
            console.error(err);
        }
    }

    const fetchAllTags = async () => {
        try {
            const response = await getAllTags();
            setAllTags(response);
        } catch (err) {
            console.error(err);
        }
    }

    const fetchAllOwners = async () => {
        try {
            const response = await getAllOwners();
            setAllOwners(response);
        } catch (err) {
            console.error(err);
        }
    }

    const fetchAllCategories = async () => {
        try {
            const response = await getAllCategories();
            setAllCategories(response);
        } catch (err) {
            console.error(err);
        }
    }

    const fetchAllComments = async () => {
        try {
            const response = await getAllComments();
            setAllComments(response);
        } catch (err) {
            console.error(err);
        }
    }

    const fetchAllImageInfos = async () => {
        try {
            const response = await getAllImageInfos();
            setAllImageInfos(response);
        } catch (err) {
            console.error(err);
        }
    }

    const fetchAllData = async () => {
        console.log('syncing with DB');
        try {
            await Promise.all([
                fetchAllArticles(),
                fetchAllOwners(),
                fetchAllTags(),
                fetchAllCategories()
            ]);
        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => {
        fetchAllData();
    }, []);

    const ctxValue = {
        allArticles,
        allOwners,
        allTags,
        allCategories,
        allComments,
        allImages: allImageInfos,
        fetchAllData,
        fetchAllArticles,
        fetchAllOwners,
        fetchAllCategories,
        fethArticleById,
        fetchOwnerById,
        fetchCategoryById
    };

    return <DBContext.Provider value={ctxValue}>
        {children}
    </DBContext.Provider>
}