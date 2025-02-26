import { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { ownerApi, categoryApi, articleApi, tagApi, annotationApi, lookupApi, groupApi } from '../backend-adapter/BackendAdapter';
import { set } from 'date-fns';

export const DBContext = createContext();

export default function DBContextProvider({ children }) {
    const [allArticles, setAllArticles] = useState([]);
    const [allOwners, setAllOwners] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [allGroups, setAllGroups] = useState([]);
    const [allAnnotations, setAllAnnotations] = useState([]);
    const [streak, setStreak] = useState(0);
    const [dbVersion, setDbVersion] = useState('');
    const [articleOrder, setArticleOrder] = useState({field: 'date', direction: 'desc'});
    const [allDataFetched, setAllDataFetched] = useState(false);

    const fetchArticleById = useCallback(async (id) => {
        try {
            const updatedArticle = await articleApi.getById(id);

            console.log(`article updated. id: ${id}`)

            const updatedArticles = allArticles.map(article => article.id === id ? updatedArticle : article);
            setAllArticles(updatedArticles);
        } catch (err) {
            console.error(err);
        }
    }, [allArticles]);

    const fetchCategoryById = useCallback(async (id) => {
        try {
            const updatedCategory = await categoryApi.getById(id);

            console.log('category updated id: ' + id)

            const updatedCategories = allCategories.map(category => category.id === id ? updatedCategory : category);
            setAllCategories(updatedCategories);
        } catch (err) {
            console.error(err);
        }
    }, [allCategories]);

    const fetchGroupById = useCallback(async (id) => {
        try {
            const updatedGroup = await groupApi.getById(id);

            console.log('group updated id: ' + id)
            console.log(updatedGroup)

            const updatedGroups = allGroups.map(group => group.id === id ? updatedGroup : group);
            setAllGroups(updatedGroups);
        } catch (err) {
            console.error(err);
        }
    }, [allGroups]);

    const fetchOwnerById = useCallback(async (id) => {
        try {
            const updatedOwner = await ownerApi.getById(id);

            console.log('owner updated id: ' + id)

            const updatedOwners = allOwners.map(owner => owner.id === id ? updatedOwner : owner);
            setAllOwners(updatedOwners);
        } catch (err) {
            console.error(err);
        }
    }, [allOwners]);

    const fetchTagById = useCallback(async (id) => {
        try {
            const updatedTag = await tagApi.getById(id);

            console.log('updated tag id: ' + id)

            const updatedTags = allTags.map(tag => tag.id === id ? updatedTag : tag);
            setAllTags(updatedTags);
        } catch (err) {
            console.error(err);
        }
    }, [allTags]);

    const fetchAnnotationById = useCallback(async (id) => {
        try {
            const updatedAnnotation = await annotationApi.getById(id);

            console.log('annotation updated id: ' + id)

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
        try {
            const str = await fetchFromLookup('streak');
            setStreak(str);
            const dbV = await fetchFromLookup('dbVersion');
            setDbVersion(dbV);
        } catch (err) {
            console.error(err);
        }
    }

    const fetchAllArticles = useCallback(async () => {
        try {
            const response = await articleApi.getAll(articleOrder);
            setAllArticles(response);
        } catch (err) {
            console.error(err);
        }
    }, [articleOrder]);

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
    
    const fetchAllGroups = useCallback(async () => {
        try {
            const response = await groupApi.getAll();
            setAllGroups(response);
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
        console.info('syncing with DB');
        try {
            await fetchAllOwners();
            await fetchAllCategories();
            await fetchAllGroups();
            await fetchAllTags();
            await fetchAllArticles();
            await fetchAllAnnotations();
            await setLookupValues();
            setAllDataFetched(true);
            // lookupApi.setLastActiveDateToToday();
        } catch (err) {
            console.error(err);
        }
    }, [articleOrder]);

    const getCategoryById = useCallback((id) => {
        return allCategories.find(category => category.id === id);
    }, [allCategories]);
    
    const getGroupById = useCallback((id) => {
        return allGroups.find(group => group.id === id);
    }, [allGroups]);

    const getCategoryByArticleId = useCallback((articleId) => {
        const article = allArticles.find(article => article.id === articleId);
        if (!article)
            return null;
        return getCategoryById(article.categoryId);
    }, [allArticles, allCategories]);

    const getOwnerById = useCallback((id) => {
        return allOwners.find(owner => owner.id === id);
    }, [allOwners]);

    const getTagById = useCallback((id) => {
        return allTags.find(tag => tag.id === id);
    }, [allTags]);

    const getArticleById = useCallback((id) => {
        return allArticles.find(article => article.id === id);
    }, [allArticles]);

    const getRelatedArticlesByArticleId = useCallback((articleId) => {
        const article = getArticleById(articleId);
        if (!article)
            return [];
        return article.relatedArticles;
    }, [allArticles, getArticleById]);

    const getAnnotationById = useCallback((id) => {
        return allAnnotations.find(annotation => annotation.id === id);
    }, [allAnnotations]);

    useEffect(() => {
        fetchAllData();
    }, []);

    useEffect(() => {
        fetchAllArticles();
    }, [articleOrder]);

    const ctxValue = useMemo(() => ({
        allArticles,
        allOwners,
        allTags,
        allCategories,
        allGroups,
        allAnnotations,
        articleOrder,
        setArticleOrder,
        fetchAllData,
        fetchAllArticles,
        fetchAllOwners,
        fetchAllCategories,
        fetchAllGroups,
        fetchAllTags,
        fetchAllAnnotations,
        fetchArticleById,
        fetchOwnerById,
        fetchCategoryById,
        fetchGroupById,
        fetchTagById,
        fetchAnnotationById,
        getArticleById,
        getRelatedArticlesByArticleId,
        getOwnerById,
        getCategoryById,
        getGroupById,
        getCategoryByArticleId,
        getTagById,
        getAnnotationById,
        streak,
        dbVersion,
        allDataFetched,
    }), [allArticles, allOwners, allTags, allCategories, allAnnotations, streak, dbVersion, articleOrder, allGroups, allDataFetched]);

    return <DBContext.Provider value={ctxValue}>
        {children}
    </DBContext.Provider>
}
