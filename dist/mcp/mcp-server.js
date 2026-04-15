"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMcpServer = void 0;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const register_tools_1 = require("./register-tools");
// Factory function - creates a new MCP Server instance per transport connection
// This fixes "Already connected to a transport" error from singleton reuse
const createMcpServer = () => {
    const server = new index_js_1.Server({
        name: 'ChromeMcpServer',
        version: '1.0.0',
    }, {
        capabilities: {
            tools: {},
        },
    });
    (0, register_tools_1.setupTools)(server);
    return server;
};
exports.createMcpServer = createMcpServer;
// Backwards compatibility - still works but creates new instance each time
const getMcpServer = () => createMcpServer();
exports.getMcpServer = getMcpServer;
//# sourceMappingURL=mcp-server.js.map