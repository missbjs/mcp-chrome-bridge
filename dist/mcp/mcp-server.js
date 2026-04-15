"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMcpServer = exports.mcpServer = exports.createMcpServer = void 0;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const register_tools_1 = require("./register-tools");
exports.mcpServer = null;
// Factory function to create a new MCP server instance
// This allows multiple concurrent HTTP transports without the "Already connected" error
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
// Legacy singleton getter for backward compatibility with stdio transport
const getMcpServer = () => {
    if (exports.mcpServer) {
        return exports.mcpServer;
    }
    exports.mcpServer = createMcpServer();
    return exports.mcpServer;
};
exports.getMcpServer = getMcpServer;
//# sourceMappingURL=mcp-server.js.map