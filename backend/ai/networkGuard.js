// Runtime enforcement of the "no data over the network" rule for the AI
// inference process. Imported first by worker.js, before node-llama-cpp, so
// every outbound path in this process throws instead of connecting.
//
// This process only ever reads local model files and receives article text
// from the main process over a parent port, so nothing here needs a socket.

import net from 'node:net';
import dns from 'node:dns';
import http from 'node:http';
import https from 'node:https';
import { syncBuiltinESMExports } from 'node:module';

export class NetworkBlockedError extends Error {
    constructor(what) {
        super(`Network access is disabled in the AI process (${what})`);
        this.name = 'NetworkBlockedError';
    }
}

function block(what) {
    return function blocked() {
        throw new NetworkBlockedError(what);
    };
}

export function installNetworkGuard() {
    // Every TCP/TLS/HTTP connection goes through net.Socket#connect.
    net.Socket.prototype.connect = block('net.Socket.connect');
    net.connect = block('net.connect');
    net.createConnection = block('net.createConnection');

    http.request = block('http.request');
    http.get = block('http.get');
    https.request = block('https.request');
    https.get = block('https.get');

    dns.lookup = block('dns.lookup');
    dns.resolve = block('dns.resolve');
    if (dns.promises) {
        dns.promises.lookup = block('dns.promises.lookup');
        dns.promises.resolve = block('dns.promises.resolve');
    }

    globalThis.fetch = block('fetch');
    if (globalThis.WebSocket) globalThis.WebSocket = block('WebSocket');
    if (globalThis.EventSource) globalThis.EventSource = block('EventSource');

    // Make `import { lookup } from 'node:dns'` etc. see the patched versions.
    syncBuiltinESMExports();

    // node-llama-cpp: never download llama.cpp sources or binaries.
    process.env.NODE_LLAMA_CPP_SKIP_DOWNLOAD = 'true';
}
