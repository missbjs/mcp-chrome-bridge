import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { setupTools } from "./register-tools.js";

// Singleton server instance for backward compatibility
let mcpServer: Server | null = null;

// Factory function to create a new MCP server instance
// This allows multiple concurrent HTTP transports without the "Already connected" error
export const createMcpServer = (): Server => {
    const server = new Server({
        name: 'ChromeMcpServer',
        version: '1.0.0',
    }, {
        capabilities: {
            tools: {},
        },
    });
    setupTools(server);
    return server;
};

// Legacy singleton getter for backward compatibility with stdio transport
export const getMcpServer = (): Server => {
    if (mcpServer) {
        return mcpServer;
    }
    mcpServer = createMcpServer();
    return mcpServer;
};