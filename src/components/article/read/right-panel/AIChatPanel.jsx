import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ArrowPathIcon, PaperAirplaneIcon, StopIcon } from '@heroicons/react/24/outline';
import CollapsiblePanel from '../../../common/CollapsiblePanel';
import { AppContext } from '../../../../store/app-context';
import { ReadContext } from '../../../../store/read-context';
import { aiApi } from '../../../../backend-adapter/BackendAdapter';

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

const bubbleBase = {
    padding: '8px 10px',
    borderRadius: 10,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontSize: 14,
    lineHeight: 1.45,
    maxWidth: '95%',
};

const AIChatPanel = ({ isCollapsed, onToggleCollapse }) => {
    const { translate: t, setActiveScreen } = useContext(AppContext);
    const { article } = useContext(ReadContext);

    const [messages, setMessages] = useState([]); // { role: 'user'|'model', text, thought? }
    const [input, setInput] = useState('');
    const [busy, setBusy] = useState(false);
    const [thinking, setThinking] = useState(false);
    const [truncated, setTruncated] = useState(false);
    const [error, setError] = useState(null);
    const [modelLoading, setModelLoading] = useState(false);

    const conversationIdRef = useRef(newId());
    const requestIdRef = useRef(null);
    const scrollRef = useRef(null);

    const articleId = article?.id;

    // A new article means a new conversation.
    useEffect(() => {
        conversationIdRef.current = newId();
        setMessages([]);
        setTruncated(false);
        setError(null);
    }, [articleId]);

    useEffect(() => {
        const offChat = aiApi.onChatEvent((ev) => {
            if (ev.requestId !== requestIdRef.current) return;
            if (ev.type === 'started') {
                setModelLoading(false);
                setTruncated(!!ev.truncated);
            } else if (ev.type === 'chunk') {
                if (ev.kind === 'thought') {
                    setThinking(true);
                    return;
                }
                setThinking(false);
                setMessages((prev) => {
                    const next = prev.slice();
                    const last = next[next.length - 1];
                    next[next.length - 1] = { ...last, text: last.text + ev.text };
                    return next;
                });
            }
        });
        const offStatus = aiApi.onStatus((s) => setModelLoading(s.state === 'loading'));
        return () => { offChat(); offStatus(); };
    }, []);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }, [messages, thinking]);

    const send = useCallback(async () => {
        const text = input.trim();
        if (!text || busy || !articleId) return;
        const history = messages.filter((m) => m.text);
        const requestId = newId();
        requestIdRef.current = requestId;
        setInput('');
        setError(null);
        setBusy(true);
        setThinking(false);
        setMessages([...history, { role: 'user', text }, { role: 'model', text: '' }]);

        const res = await aiApi.sendChat({
            requestId,
            conversationId: conversationIdRef.current,
            articleId,
            history,
            message: text,
        });

        requestIdRef.current = null;
        setBusy(false);
        setThinking(false);
        setModelLoading(false);
        if (!res.ok) {
            // Drop the failed turn so history stays consistent with the model.
            setMessages(history);
            setInput(text);
            setError(res.error === 'NO_MODEL' ? 'NO_MODEL' : res.error);
            return;
        }
        // Keep the final text authoritative (streamed chunks may skip segments).
        setMessages((prev) => {
            const next = prev.slice();
            next[next.length - 1] = { role: 'model', text: res.text || next[next.length - 1].text };
            return next;
        });
    }, [input, busy, articleId, messages]);

    const stop = () => {
        if (requestIdRef.current) aiApi.cancelChat(requestIdRef.current);
    };

    const reset = () => {
        if (busy) return;
        aiApi.resetChat(conversationIdRef.current);
        conversationIdRef.current = newId();
        setMessages([]);
        setTruncated(false);
        setError(null);
    };

    const onKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            send();
        }
    };

    const headerButtons = [
        { onClick: reset, title: t('ai new chat'), icon: <ArrowPathIcon className='w-5 h-5' /> },
    ];

    return (
        <CollapsiblePanel
            isCollapsed={isCollapsed}
            onToggleCollapse={onToggleCollapse}
            title={t('ai chat')}
            headerButtons={headerButtons}
        >
            <div className='flex flex-col h-full p-2 gap-2' style={{ color: 'var(--text-primary)' }}>
                <div ref={scrollRef} className='flex-1 overflow-y-auto flex flex-col gap-2' style={{ minHeight: 120 }}>
                    {messages.length === 0 && !error && (
                        <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{t('ai chat empty hint')}</div>
                    )}
                    {messages.map((m, i) => (
                        <div
                            key={i}
                            style={{
                                ...bubbleBase,
                                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                backgroundColor: m.role === 'user' ? 'var(--border-primary)' : 'var(--bg-tertiary)',
                                color: m.role === 'user' ? '#f9fafb' : 'var(--text-primary)',
                            }}
                        >
                            {m.text || (busy && i === messages.length - 1
                                ? <span style={{ color: 'var(--text-secondary)' }}>
                                    {modelLoading ? t('ai loading model') : thinking ? t('ai thinking') : '…'}
                                  </span>
                                : null)}
                        </div>
                    ))}
                    {truncated && (
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t('ai article truncated')}</div>
                    )}
                    {error && (
                        <div style={{ fontSize: 13, color: '#b91c1c' }}>
                            {error === 'NO_MODEL' ? (
                                <span>
                                    {t('ai no model selected')}{' '}
                                    <button className='underline' onClick={() => setActiveScreen('settings')}>{t('ai open settings')}</button>
                                </span>
                            ) : error}
                        </div>
                    )}
                </div>
                <div className='flex gap-2 items-end'>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder={t('ai ask placeholder')}
                        rows={2}
                        className='flex-1 rounded-md p-2 resize-none'
                        style={{
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-secondary)',
                            fontSize: 14,
                        }}
                    />
                    {busy ? (
                        <button onClick={stop} title={t('ai stop')} className='p-2 rounded-md' style={{ backgroundColor: '#b91c1c', color: '#fef2f2' }}>
                            <StopIcon className='w-5 h-5' />
                        </button>
                    ) : (
                        <button onClick={send} title={t('ai send')} className='p-2 rounded-md' style={{ backgroundColor: 'var(--border-primary)', color: '#f9fafb' }}>
                            <PaperAirplaneIcon className='w-5 h-5' />
                        </button>
                    )}
                </div>
            </div>
        </CollapsiblePanel>
    );
};

export default AIChatPanel;
