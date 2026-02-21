"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_MESSAGES = exports.HTTP_STATUS = exports.SERVER_CONFIG = exports.TIMEOUTS = exports.NATIVE_SERVER_PORT = exports.NATIVE_MESSAGE_TYPE = void 0;
var NATIVE_MESSAGE_TYPE;
(function (NATIVE_MESSAGE_TYPE) {
    NATIVE_MESSAGE_TYPE["START"] = "start";
    NATIVE_MESSAGE_TYPE["STARTED"] = "started";
    NATIVE_MESSAGE_TYPE["STOP"] = "stop";
    NATIVE_MESSAGE_TYPE["STOPPED"] = "stopped";
    NATIVE_MESSAGE_TYPE["PING"] = "ping";
    NATIVE_MESSAGE_TYPE["PONG"] = "pong";
    NATIVE_MESSAGE_TYPE["ERROR"] = "error";
})(NATIVE_MESSAGE_TYPE || (exports.NATIVE_MESSAGE_TYPE = NATIVE_MESSAGE_TYPE = {}));
exports.NATIVE_SERVER_PORT = 56889;
// Timeout constants (in milliseconds)
exports.TIMEOUTS = {
    DEFAULT_REQUEST_TIMEOUT: 15000,
    EXTENSION_REQUEST_TIMEOUT: 20000,
    PROCESS_DATA_TIMEOUT: 20000,
};
// Server configuration
exports.SERVER_CONFIG = {
    HOST: '127.0.0.1',
    CORS_ORIGIN: true,
    LOGGER_ENABLED: false,
};
// HTTP Status codes
exports.HTTP_STATUS = {
    OK: 200,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    INTERNAL_SERVER_ERROR: 500,
    GATEWAY_TIMEOUT: 504,
};
// Error messages
exports.ERROR_MESSAGES = {
    NATIVE_HOST_NOT_AVAILABLE: 'Native host connection not established.',
    SERVER_NOT_RUNNING: 'Server is not actively running.',
    REQUEST_TIMEOUT: 'Request to extension timed out.',
    INVALID_MCP_REQUEST: 'Invalid MCP request or session.',
    INVALID_SESSION_ID: 'Invalid or missing MCP session ID.',
    INTERNAL_SERVER_ERROR: 'Internal Server Error',
    MCP_SESSION_DELETION_ERROR: 'Internal server error during MCP session deletion.',
    MCP_REQUEST_PROCESSING_ERROR: 'Internal server error during MCP request processing.',
    INVALID_SSE_SESSION: 'Invalid or missing MCP session ID for SSE.',
};
//# sourceMappingURL=index.js.map