"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMcpServer = exports.mcpServer = void 0;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const register_tools_1 = require("./register-tools");
exports.mcpServer = null;
const getMcpServer = () => {
    // Streamable HTTP has a separate transport/session per client. A single
    // Server instance cannot be connected to multiple transports concurrently.
    // Create one server per transport instead of reusing a process-wide singleton.
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
exports.getMcpServer = getMcpServer;
//# sourceMappingURL=mcp-server.js.map
