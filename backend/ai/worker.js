// AI inference process. Started by AIService via utilityProcess.fork (or
// child_process.fork in tests). It loads a local GGUF model with
// node-llama-cpp and answers chat requests about one article at a time.
//
// The network guard is installed before node-llama-cpp is imported, so any
// attempt to open a socket from this process throws.

import { installNetworkGuard } from './networkGuard.js';
installNetworkGuard();

const { getLlama, LlamaChatSession } = await import('node-llama-cpp');
const { buildSystemPrompt } = await import('./articleText.js');

// ---------------------------------------------------------------- transport
const port = process.parentPort ?? null;
function send(msg) {
    if (port) port.postMessage(msg);
    else process.send?.(msg);
}
function onMessage(handler) {
    if (port) port.on('message', (e) => handler(e.data));
    else process.on('message', handler);
}

// -------------------------------------------------------------------- state
let llama = null;
let model = null;
let modelPath = null;
let context = null;
let sequence = null;
let active = null; // { conversationId, session, turns }
const running = new Map(); // requestId -> AbortController

const CONTEXT_MIN = 4096;
const CONTEXT_MAX = 32768;
// Reasoning models (Qwen 3.5, Gemma 4) think before answering; cap it so
// answers start within a reasonable time.
const THOUGHT_BUDGET = 1024;

async function ensureLlama() {
    if (!llama) {
        llama = await getLlama({
            build: 'never',
            usePrebuiltBinaries: true,
            gpu: 'auto',
            progressLogs: false,
        });
    }
    return llama;
}

async function disposeSession() {
    if (active?.session) {
        active.session.dispose({ disposeSequence: false });
    }
    active = null;
    if (sequence) await sequence.clearHistory();
}

async function unload() {
    for (const ac of running.values()) ac.abort();
    running.clear();
    active = null;
    if (context) await context.dispose();
    if (model) await model.dispose();
    context = null;
    sequence = null;
    model = null;
    modelPath = null;
}

async function load(path) {
    if (model && modelPath === path) return info();
    await unload();
    const l = await ensureLlama();
    model = await l.loadModel({ modelPath: path });
    context = await model.createContext({
        contextSize: { min: CONTEXT_MIN, max: Math.min(CONTEXT_MAX, model.trainContextSize) },
        flashAttention: true,
    });
    sequence = context.getSequence();
    modelPath = path;
    return info();
}

function info() {
    return {
        loaded: !!model,
        modelPath,
        gpu: llama?.gpu ?? null,
        contextSize: context?.contextSize ?? null,
        trainContextSize: model?.trainContextSize ?? null,
        sizeBytes: model?.size ?? null,
    };
}

// Fit the article into the context window, leaving room for the chat.
function fitArticle(header, body) {
    const ctx = context.contextSize;
    const reserve = Math.max(2048, Math.floor(ctx * 0.3));
    const budget = ctx - reserve - model.tokenize(header).length - 200;
    const bodyTokens = model.tokenize(body);
    if (bodyTokens.length <= budget) {
        return { text: `${header}\n\n${body}`, truncated: false };
    }
    const cut = model.detokenize(bodyTokens.slice(0, Math.max(0, budget)));
    return { text: `${header}\n\n${cut}\n\n[...]`, truncated: true };
}

async function prepareSession({ conversationId, systemPrompt, history }) {
    const priorTurns = history.length;
    if (active && active.conversationId === conversationId && active.turns === priorTurns) {
        return active.session;
    }
    await disposeSession();
    const session = new LlamaChatSession({
        contextSequence: sequence,
        systemPrompt,
        autoDisposeSequence: false,
    });
    if (priorTurns > 0) {
        const base = session.getChatHistory();
        const restored = history.map((h) =>
            h.role === 'user' ? { type: 'user', text: h.text } : { type: 'model', response: [h.text] });
        session.setChatHistory([...base, ...restored]);
    }
    active = { conversationId, session, turns: priorTurns };
    return session;
}

async function chat(req) {
    const { requestId, conversationId, header, body, history = [], message } = req;
    if (!model) throw new Error('No model loaded');
    if (running.size > 0) throw new Error('busy');

    const { text: articleText, truncated } = fitArticle(header, body);
    const systemPrompt = buildSystemPrompt(articleText, { truncated });

    const session = await prepareSession({ conversationId, systemPrompt, history });
    const ac = new AbortController();
    running.set(requestId, ac);
    send({ type: 'started', requestId, truncated });
    let answerStarted = false;

    try {
        const answer = await session.prompt(message, {
            signal: ac.signal,
            stopOnAbortSignal: true,
            temperature: 0.6,
            topP: 0.9,
            minP: 0.05,
            budgets: { thoughtTokens: THOUGHT_BUDGET },
            onResponseChunk(chunk) {
                if (!chunk.text) return;
                const kind = chunk.type === 'segment' && chunk.segmentType === 'thought' ? 'thought' : 'text';
                if (chunk.type === 'segment' && kind !== 'thought') return;
                let text = chunk.text;
                if (kind === 'text' && !answerStarted) {
                    text = text.trimStart();
                    if (!text) return;
                    answerStarted = true;
                }
                send({ type: 'chunk', requestId, kind, text });
            },
        });
        // The user message and the answer are now part of the session.
        active.turns += 2;
        send({ type: 'done', requestId, text: answer.trim(), aborted: ac.signal.aborted, truncated });
    } finally {
        running.delete(requestId);
    }
}

// ------------------------------------------------------------------ routing
onMessage(async (msg) => {
    const { type, requestId } = msg || {};
    try {
        switch (type) {
            case 'load':
                send({ type: 'result', requestId, result: await load(msg.modelPath) });
                break;
            case 'unload':
                await unload();
                send({ type: 'result', requestId, result: info() });
                break;
            case 'status':
                send({ type: 'result', requestId, result: info() });
                break;
            case 'resetConversation':
                if (active?.conversationId === msg.conversationId) await disposeSession();
                send({ type: 'result', requestId, result: true });
                break;
            case 'chat':
                await chat(msg);
                break;
            case 'cancel':
                running.get(msg.targetRequestId)?.abort();
                send({ type: 'result', requestId, result: true });
                break;
            default:
                send({ type: 'error', requestId, error: `Unknown message type: ${type}` });
        }
    } catch (err) {
        // A failed or aborted chat leaves the session in an unknown state.
        if (type === 'chat' && err?.message !== 'busy') await disposeSession().catch(() => {});
        send({ type: 'error', requestId, error: err?.message || String(err) });
    }
});

send({ type: 'ready' });
