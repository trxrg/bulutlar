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
    const [infoMenuIsOpen, setInfoMenuIsOpen] = useState(false);
    const [article, setArticle] = useState(null);
    const [url, setUrl] = useState(null);

    const linkRef = useRef(null);

    const handleClick = (e) => {
        e.preventDefault();
        try {
            if (article) {
                console.info('Link clicked for articleId:', article.id);
                handleAddTab(e, article.id);
            } else {
                console.warn('Link clicked but article is null url:', url);
                toastr.warning(t('link not found'));
            }
        } catch (error) {
            console.error('Error handling link click:', error);
        }
    };

    const handleRightClick = (e) => {
        e.preventDefault();
        setContextMenuIsOpen(true);
    };

    const handleRemoveLink = () => {
        onDelete(blockKey, { start, end });
        setContextMenuIsOpen(false);
    };

    useEffect(() => {
        try {
            const { url } = contentState.getEntity(entityKey).getData();
            setUrl(url);
            if (isArticleUrl(url)) {
                const id = urlToArticleId(url);
                setArticle(getArticleById(id));
            }
        } catch (error) {
            console.error('Error getting article id or title:', error);
        }
    }, []);

    const handleMouseEnter = (e) => {
        calculateContextMenuPosition(e);
        setInfoMenuIsOpen(true);
    };

    const handleMouseLeave = (e) => {
        setInfoMenuIsOpen(false);
    };

    const calculateContextMenuPosition = (e) => {
        if (linkRef.current) {
            const rect = linkRef.current.getBoundingClientRect();
            const rectParent = linkRef.current.parentElement.getBoundingClientRect();
            setContextMenuPosition({ x: rect.left - rectParent.left, y: rect.top - rectParent.top + rect.height });
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
                    position={{ top: 20, left: 0 }}>
                    <div className='flex flex-col'>
                        <ActionButton color={'red'} onClick={handleRemoveLink}
                            className='hover:bg-red-300'>{t('remove link')}
                        </ActionButton>
                    </div>
                </ContextMenu>
            </div>
            <ContextMenu isOpen={infoMenuIsOpen}
                onClose={() => setInfoMenuIsOpen(false)}
                position={{ top: contextMenuPosition.y, left: 0 }}>
                {article &&
                    <div className='flex flex-col'>
                        <p>{article.title}</p>
                        <ArticleInfo article={article} isEditable={false}></ArticleInfo>
                    </div>}
            </ContextMenu>
        </>
    );
};

export default Link;