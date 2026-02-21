"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupTools = void 0;
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const native_messaging_host_1 = __importDefault(require("../native-messaging-host"));
const chrome_mcp_shared_1 = require("@vicoplus/chrome-mcp-shared");
const setupTools = (server) => {
    // List tools handler
    server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({ tools: chrome_mcp_shared_1.TOOL_SCHEMAS }));
    // Call tool handler
    server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => handleToolCall(request.params.name, request.params.arguments || {}));
};
exports.setupTools = setupTools;
const handleToolCall = async (name, args) => {
    try {
        // 发送请求到Chrome扩展并等待响应
        const response = await native_messaging_host_1.default.sendRequestToExtensionAndWait({
            name,
            args,
        }, chrome_mcp_shared_1.NativeMessageType.CALL_TOOL, 30000);
        if (response.status === 'success') {
            return response.data;
        }
        else {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error calling tool: ${response.error}`,
                    },
                ],
                isError: true,
            };
        }
    }
    catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error calling tool: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
};
//# sourceMappingURL=register-tools.js.map