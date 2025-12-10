import React, { useState, useContext, useEffect, useRef } from 'react';
import { AppContext } from '../../../../store/app-context';
import { DBContext } from '../../../../store/db-context';
import ContextMenu from '../../../common/ContextMenu';
import ActionButton from '../../../common/ActionButton';
import { isArticleUrl, urlToArticleId } from '../../util';
import ArticleInfo from '../../ArticleInfo';
import toastr from 'toastr';

const Link = (props) => {
    const contentState = props.contentState;
    const blockKey = props.blockKey;
    const entityKey = props.entityKey;
    const onDelete = props.onDelete;
    const children = props.children;
    const start = props.start;
    const end = props.end;

    const { translate: t, handleAddTab } = useContext(AppContext);
    const { getArticleById } = useContext(DBContext);

    const [contextMenuIsOpen, setContextMenuIsOpen] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 10, y: 10 });
    const [rightClickPosition, setRightClickPosition] = useState({ x: 10, y: 10 });
    const [infoMenuIsOpen, setInfoMenuIsOpen] = useState(false);
    const [article, setArticle] = useState(null);
    const [url, setUrl] = useState(null);

    const linkRef = useRef(null);

    const handleClick = (e) => {
        e.preventDefault();
        try {
            // Get fresh URL from Draft.js state instead of relying on component state
            const entity = contentState.getEntity(entityKey);
            const { url: currentUrl } = entity.getData();
            
            if (isArticleUrl(currentUrl)) {
                const id = urlToArticleId(currentUrl);
                const currentArticle = getArticleById(id);
                
                if (currentArticle) {
                    handleAddTab(e, currentArticle.id);
                } else {
                    console.warn('Link clicked but article not found for URL:', currentUrl);
                    toastr.warning(t('link not found'));
                }
            } else {
                console.warn('Link clicked but not an article URL:', currentUrl);
                toastr.warning(t('link not found'));
            }
        } catch (error) {
            console.error('Error handling link click:', error);
            toastr.warning(t('link not found'));
        }
    };

    const handleRightClick = (e) => {
        e.preventDefault();
        setRightClickPosition({ x: e.clientX, y: e.clientY });
        setContextMenuIsOpen(true);
    };

    const handleRemoveLink = () => {
        onDelete(blockKey, { start, end });
        setContextMenuIsOpen(false);
    };

    useEffect(() => {
        try {
            const entity = contentState.getEntity(entityKey);
            const { url } = entity.getData();
            setUrl(url);
            
            if (isArticleUrl(url)) {
                const id = urlToArticleId(url);
                const articleData = getArticleById(id);
                setArticle(articleData);
            } else {
                setArticle(null);
                console.log('Link component - not an article URL');
            }
        } catch (error) {
            console.error('Error getting article id or title:', error);
            setArticle(null);
            setUrl(null);
        }
    }, [contentState, entityKey, getArticleById]);

    const handleMouseEnter = (e) => {
        calculateContextMenuPosition(e);
        setInfoMenuIsOpen(true);
    };

    const handleMouseLeave = (e) => {
        setInfoMenuIsOpen(false);
    };

    const calculateContextMenuPosition = () => {
        if (linkRef.current) {
            const rect = linkRef.current.getBoundingClientRect();
            
            // Use viewport coordinates for fixed positioning
            let x = rect.left;
            const y = rect.bottom;
            
            // Estimate menu width and ensure it doesn't go off-screen
            const estimatedMenuWidth = 300;
            if (x + estimatedMenuWidth > window.innerWidth) {
                x = Math.max(10, window.innerWidth - estimatedMenuWidth - 10);
            }
            
            setContextMenuPosition({ x, y });
        }
    }

    return (
        <>
            <div className='inline relative' ref={linkRef}>
                <span className="link" onClick={handleClick} onContextMenu={handleRightClick}
                    onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                    {children}
                </span>
                <ContextMenu isOpen={contextMenuIsOpen}
                    onClose={() => setContextMenuIsOpen(false)}
                    position={{ top: rightClickPosition.y, left: rightClickPosition.x }}>
                    <div className='flex flex-col'>
                        <ActionButton color={'red'} onClick={handleRemoveLink}>
                            {t('remove link')}
                        </ActionButton>
                    </div>
                </ContextMenu>
            </div>
            <ContextMenu isOpen={infoMenuIsOpen}
                onClose={() => setInfoMenuIsOpen(false)}
                position={{ top: contextMenuPosition.y, left: contextMenuPosition.x }}>
                {article &&
                    <div className='flex flex-col'>
                        <p>{article.title}</p>
                        <ArticleInfo article={article} isEditable={false} showReadTime={true}></ArticleInfo>
                    </div>}
            </ContextMenu>
        </>
    );
};

export default Link;