"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = void 0;
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const constant_1 = require("../constant");
const sse_js_1 = require("@modelcontextprotocol/sdk/server/sse.js");
const streamableHttp_js_1 = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const node_crypto_1 = require("node:crypto");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const mcp_server_1 = require("../mcp/mcp-server");
class Server {
    fastify;
    isRunning = false; // Changed to public or provide a getter
    nativeHost = null;
    transportsMap = new Map();
    constructor() {
        this.fastify = (0, fastify_1.default)({ logger: constant_1.SERVER_CONFIG.LOGGER_ENABLED });
        this.setupPlugins();
        this.setupRoutes();
    }
    /**
     * Associate NativeMessagingHost instance
     */
    setNativeHost(nativeHost) {
        this.nativeHost = nativeHost;
    }
    async setupPlugins() {
        await this.fastify.register(cors_1.default, {
            origin: constant_1.SERVER_CONFIG.CORS_ORIGIN,
        });
    }
    setupRoutes() {
        // for ping
        this.fastify.get('/ask-extension', async (request, reply) => {
            if (!this.nativeHost) {
                return reply
                    .status(constant_1.HTTP_STATUS.INTERNAL_SERVER_ERROR)
                    .send({ error: constant_1.ERROR_MESSAGES.NATIVE_HOST_NOT_AVAILABLE });
            }
            if (!this.isRunning) {
                return reply
                    .status(constant_1.HTTP_STATUS.INTERNAL_SERVER_ERROR)
                    .send({ error: constant_1.ERROR_MESSAGES.SERVER_NOT_RUNNING });
            }
            try {
                // wait from extension message
                const extensionResponse = await this.nativeHost.sendRequestToExtensionAndWait(request.query, 'process_data', constant_1.TIMEOUTS.EXTENSION_REQUEST_TIMEOUT);
                return reply.status(constant_1.HTTP_STATUS.OK).send({ status: 'success', data: extensionResponse });
            }
            catch (error) {
                if (error.message.includes('timed out')) {
                    return reply
                        .status(constant_1.HTTP_STATUS.GATEWAY_TIMEOUT)
                        .send({ status: 'error', message: constant_1.ERROR_MESSAGES.REQUEST_TIMEOUT });
                }
                else {
                    return reply.status(constant_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
                        status: 'error',
                        message: `Failed to get response from extension: ${error.message}`,
                    });
                }
            }
        });
        // Compatible with SSE
        this.fastify.get('/sse', async (_, reply) => {
            try {
                // Set SSE headers
                reply.raw.writeHead(constant_1.HTTP_STATUS.OK, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    Connection: 'keep-alive',
                });
                // Create SSE transport
                const transport = new sse_js_1.SSEServerTransport('/messages', reply.raw);
                this.transportsMap.set(transport.sessionId, transport);
                reply.raw.on('close', () => {
                    this.transportsMap.delete(transport.sessionId);
                });
                const server = (0, mcp_server_1.getMcpServer)();
                await server.connect(transport);
                // Keep connection open
                reply.raw.write(':\n\n');
            }
            catch (error) {
                if (!reply.sent) {
                    reply.code(constant_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).send(constant_1.ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
                }
            }
        });
        // Compatible with SSE
        this.fastify.post('/messages', async (req, reply) => {
            try {
                const { sessionId } = req.query;
                const transport = this.transportsMap.get(sessionId);
                if (!sessionId || !transport) {
                    reply.code(constant_1.HTTP_STATUS.BAD_REQUEST).send('No transport found for sessionId');
                    return;
                }
                await transport.handlePostMessage(req.raw, reply.raw, req.body);
            }
            catch (error) {
                if (!reply.sent) {
                    reply.code(constant_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).send(constant_1.ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
                }
            }
        });
        // POST /mcp: Handle client-to-server messages
        this.fastify.post('/mcp', async (request, reply) => {
            const sessionId = request.headers['mcp-session-id'];
            let transport = this.transportsMap.get(sessionId || '');
            if (transport) {
                // transport found, do nothing
            }
            else if (!sessionId && (0, types_js_1.isInitializeRequest)(request.body)) {
                const newSessionId = (0, node_crypto_1.randomUUID)(); // Generate session ID
                transport = new streamableHttp_js_1.StreamableHTTPServerTransport({
                    sessionIdGenerator: () => newSessionId, // Use pre-generated ID
                    onsessioninitialized: (initializedSessionId) => {
                        // Ensure transport instance exists and session ID matches
                        if (transport && initializedSessionId === newSessionId) {
                            this.transportsMap.set(initializedSessionId, transport);
                        }
                    },
                });
                transport.onclose = () => {
                    if (transport?.sessionId && this.transportsMap.get(transport.sessionId)) {
                        this.transportsMap.delete(transport.sessionId);
                    }
                };
                await (0, mcp_server_1.getMcpServer)().connect(transport);
            }
            else {
                reply.code(constant_1.HTTP_STATUS.BAD_REQUEST).send({ error: constant_1.ERROR_MESSAGES.INVALID_MCP_REQUEST });
                return;
            }
            try {
                await transport.handleRequest(request.raw, reply.raw, request.body);
            }
            catch (error) {
                if (!reply.sent) {
                    reply
                        .code(constant_1.HTTP_STATUS.INTERNAL_SERVER_ERROR)
                        .send({ error: constant_1.ERROR_MESSAGES.MCP_REQUEST_PROCESSING_ERROR });
                }
            }
        });
        this.fastify.get('/mcp', async (request, reply) => {
            const sessionId = request.headers['mcp-session-id'];
            const transport = sessionId
                ? this.transportsMap.get(sessionId)
                : undefined;
            if (!transport) {
                reply.code(constant_1.HTTP_STATUS.BAD_REQUEST).send({ error: constant_1.ERROR_MESSAGES.INVALID_SSE_SESSION });
                return;
            }
            reply.raw.setHeader('Content-Type', 'text/event-stream');
            reply.raw.setHeader('Cache-Control', 'no-cache');
            reply.raw.setHeader('Connection', 'keep-alive');
            reply.raw.flushHeaders(); // Ensure headers are sent immediately
            try {
                // transport.handleRequest will take over the response stream
                await transport.handleRequest(request.raw, reply.raw);
                if (!reply.sent) {
                    // If transport didn't send anything (unlikely for SSE initial handshake)
                    reply.hijack(); // Prevent Fastify from automatically sending response
                }
            }
            catch (error) {
                if (!reply.raw.writableEnded) {
                    reply.raw.end();
                }
            }
            request.socket.on('close', () => {
                request.log.info(`SSE client disconnected for session: ${sessionId}`);
                // transport's onclose should handle its own cleanup
            });
        });
        this.fastify.delete('/mcp', async (request, reply) => {
            const sessionId = request.headers['mcp-session-id'];
            const transport = sessionId
                ? this.transportsMap.get(sessionId)
                : undefined;
            if (!transport) {
                reply.code(constant_1.HTTP_STATUS.BAD_REQUEST).send({ error: constant_1.ERROR_MESSAGES.INVALID_SESSION_ID });
                return;
            }
            try {
                await transport.handleRequest(request.raw, reply.raw);
                // Assume transport.handleRequest will send response or transport.onclose will cleanup
                if (!reply.sent) {
                    reply.code(constant_1.HTTP_STATUS.NO_CONTENT).send();
                }
            }
            catch (error) {
                if (!reply.sent) {
                    reply
                        .code(constant_1.HTTP_STATUS.INTERNAL_SERVER_ERROR)
                        .send({ error: constant_1.ERROR_MESSAGES.MCP_SESSION_DELETION_ERROR });
                }
            }
        });
    }
    async start(port = constant_1.NATIVE_SERVER_PORT, nativeHost) {
        if (!this.nativeHost) {
            this.nativeHost = nativeHost; // Ensure nativeHost is set
        }
        else if (this.nativeHost !== nativeHost) {
            this.nativeHost = nativeHost; // Update to the passed instance
        }
        if (this.isRunning) {
            return;
        }
        try {
            await this.fastify.listen({ port, host: constant_1.SERVER_CONFIG.HOST });
            this.isRunning = true; // Update running status
            // No need to return, Promise resolves void by default
        }
        catch (err) {
            this.isRunning = false; // Startup failed, reset status
            // Throw error instead of exiting directly, let caller (possibly NativeHost) handle
            throw err; // or return Promise.reject(err);
            // process.exit(1); // Not recommended to exit directly here
        }
    }
    async stop() {
        if (!this.isRunning) {
            return;
        }
        // this.nativeHost = null; // Not recommended to nullify here, association relationship may still be needed
        try {
            await this.fastify.close();
            this.isRunning = false; // Update running status
        }
        catch (err) {
            // Even if closing fails, mark as not running, but log the error
            this.isRunning = false;
            throw err; // Throw error
        }
    }
    getInstance() {
        return this.fastify;
    }
}
exports.Server = Server;
const serverInstance = new Server();
exports.default = serverInstance;
//# sourceMappingURL=index.js.map