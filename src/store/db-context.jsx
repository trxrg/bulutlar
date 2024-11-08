import { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { ownerApi, categoryApi, articleApi, tagApi, annotationApi, lookupApi } from '../backend-adapter/BackendAdapter';

export const DBContext = createContext();

export default function DBContextProvider({ children }) {
    const [allArticles, setAllArticles] = useState([]);
    const [allOwners, setAllOwners] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [allAnnotations, setAllAnnotations] = useState([]);
    const [streak, setStreak] = useState(0);
    const [dbVersion, setDbVersion] = useState(null);

    const fetchArticleById = useCallback(async (id) => {
        try {
            const updatedArticle = await articleApi.getById(id);

            console.log('updated article')
            console.log(updatedArticle)

            const updatedArticles = allArticles.map(article => article.id === id ? updatedArticle : article);
            setAllArticles(updatedArticles);
        } catch (err) {
            console.error(err);
        }
    }, [allArticles]);

    const fetchCategoryById = useCallback(async (id) => {
        try {
            const updatedCategory = await categoryApi.getById(id);

            console.log('updated category')
            console.log(updatedCategory)

            const updatedCategories = allCategories.map(category => category.id === id ? updatedCategory : category);
            setAllCategories(updatedCategories);
        } catch (err) {
            console.error(err);
        }
    }, [allCategories]);

    const fetchOwnerById = useCallback(async (id) => {
        try {
            const updatedOwner = await ownerApi.getById(id);

            console.log('updated owner')
            console.log(updatedOwner)

            const updatedOwners = allOwners.map(owner => owner.id === id ? updatedOwner : owner);
            setAllOwners(updatedOwners);
        } catch (err) {
            console.error(err);
        }
    }, [allOwners]);

    const fetchTagById = useCallback(async (id) => {
        try {
            const updatedTag = await tagApi.getById(id);

            console.log('updated tag')
            console.log(updatedTag)

            const updatedTags = allTags.map(tag => tag.id === id ? updatedTag : tag);
            setAllTags(updatedTags);
        } catch (err) {
            console.error(err);
        }
    }, [allTags]);

    const fetchAnnotationById = useCallback(async (id) => {
        try {
            const updatedAnnotation = await annotationApi.getById(id);

            console.log('updated annotation')
            console.log(updatedAnnotation)

            const updatedAnnotations = allAnnotations.map(annotation => annotation.id === id ? updatedAnnotation : annotation);
            setAllAnnotations(updatedAnnotations);
        } catch (err) {
            console.error(err);
        }
    }, [allAnnotations]);

    const fetchFromLookup = async (label) => {
        try {
            const response = await lookupApi.getByLabel(label);
            return response.value;
        } catch (err) {
            console.error(err);
        }
    };

    const setLookupValues = async () => {
        fetchFromLookup('streak').then(value => setStreak(value));
        fetchFromLookup('dbVersion').then(value => setDbVersion(value));
    }

    const fetchAllArticles = useCallback(async () => {
        try {
            const response = await articleApi.getAll();
            console.log('allArticles')
            console.log(response)
            setAllArticles(response);
        } catch (err) {
            console.error(err);
        }
    }, []);

    const fetchAllTags = useCallback(async () => {
        try {
            const response = await tagApi.getAll();
            setAllTags(response);
        } catch (err) {
            console.error(err);
        }
    }, []);

    const fetchAllOwners = useCallback(async () => {
        try {
            const response = await ownerApi.getAll();
            setAllOwners(response);
        } catch (err) {
            console.error(err);
        }
    }, []);

    const fetchAllCategories = useCallback(async () => {
        try {
            const response = await categoryApi.getAll();
            setAllCategories(response);
        } catch (err) {
            console.error(err);
        }
    }, []);

    const fetchAllAnnotations = useCallback(async () => {
        try {
            const response = await annotationApi.getAll();
            setAllAnnotations(response);
        } catch (err) {
            console.error(err);
        }
    }, []);

    const fetchAllData = useCallback(async () => {
        console.log('syncing with DB');
        try {
            await fetchAllOwners();
            await fetchAllCategories();
            await fetchAllTags();
            await fetchAllArticles();
            await fetchAllAnnotations();
            await setLookupValues();
            lookupApi.setLastActiveDateToToday();
        } catch (err) {
            console.error(err);
        }
    }, []);

    const getCategoryById = useCallback((id) => {
        return allCategories.find(category => category.id === id);
    }, [allCategories]);

    const getOwnerById = useCallback((id) => {
        return allOwners.find(owner => owner.id === id);
    }, [allOwners]);

    const getTagById = useCallback((id) => {
        return allTags.find(tag => tag.id === id);
    }, [allTags]);

    const getArticleById = useCallback((id) => {
        return allArticles.find(article => article.id === id);
    }, [allArticles]);

    const getAnnotationById = useCallback((id) => {
        return allAnnotations.find(annotation => annotation.id === id);
    }, [allAnnotations]);

    useEffect(() => {
        fetchAllData();
    }, []);

    const ctxValue = useMemo(() => ({
        allArticles,
        allOwners,
        allTags,
        allCategories,
        allAnnotations,
        fetchAllData,
        fetchAllArticles,
        fetchAllOwners,
        fetchAllCategories,
        fetchAllTags,
        fetchAllAnnotations,
        fetchArticleById,
        fetchOwnerById,
        fetchCategoryById,
        fetchTagById,
        fetchAnnotationById,
        getArticleById,
        getOwnerById,
        getCategoryById,
        getTagById,
        getAnnotationById,
        streak,
        dbVersion,
    }), [allArticles, allOwners, allTags, allCategories, allAnnotations, streak]);

    return <DBContext.Provider value={ctxValue}>
        {children}
    </DBContext.Provider>
}
