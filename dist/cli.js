#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const utils_1 = require("./scripts/utils");
// Import writeNodePath from postinstall
async function writeNodePath() {
    try {
        const nodePath = process.execPath;
        const nodePathFile = path.join(__dirname, 'node_path.txt');
        console.log((0, utils_1.colorText)(`Writing Node.js path: ${nodePath}`, 'blue'));
        fs.writeFileSync(nodePathFile, nodePath, 'utf8');
        console.log((0, utils_1.colorText)('✓ Node.js path written for run_host scripts', 'green'));
    }
    catch (error) {
        console.warn((0, utils_1.colorText)(`⚠️ Failed to write Node.js path: ${error.message}`, 'yellow'));
    }
}
commander_1.program
    .version(require('../package.json').version)
    .description('Mcp Chrome Bridge - Local service for communicating with Chrome extension');
// Register Native Messaging host
commander_1.program
    .command('register')
    .description('Register Native Messaging host')
    .option('-f, --force', 'Force re-registration')
    .option('-s, --system', 'Use system-level installation (requires administrator/sudo privileges)')
    .action(async (options) => {
    try {
        // Write Node.js path for run_host scripts
        await writeNodePath();
        // Detect if running with root/administrator privileges
        const isRoot = process.getuid && process.getuid() === 0; // Unix/Linux/Mac
        let isAdmin = false;
        if (process.platform === 'win32') {
            try {
                isAdmin = require('is-admin')(); // Windows requires additional package
            }
            catch (error) {
                console.warn((0, utils_1.colorText)('Warning: Unable to detect administrator privileges on Windows', 'yellow'));
                isAdmin = false;
            }
        }
        const hasElevatedPermissions = isRoot || isAdmin;
        // If --system option is specified or running with root/administrator privileges
        if (options.system || hasElevatedPermissions) {
            await (0, utils_1.registerWithElevatedPermissions)();
            console.log((0, utils_1.colorText)('System-level Native Messaging host registered successfully!', 'green'));
            console.log((0, utils_1.colorText)('You can now use connectNative in Chrome extension to connect to this service.', 'blue'));
        }
        else {
            // Regular user-level installation
            console.log((0, utils_1.colorText)('Registering user-level Native Messaging host...', 'blue'));
            const success = await (0, utils_1.tryRegisterUserLevelHost)();
            if (success) {
                console.log((0, utils_1.colorText)('Native Messaging host registered successfully!', 'green'));
                console.log((0, utils_1.colorText)('You can now use connectNative in Chrome extension to connect to this service.', 'blue'));
            }
            else {
                console.log((0, utils_1.colorText)('User-level registration failed, please try the following methods:', 'yellow'));
                console.log((0, utils_1.colorText)('  1. sudo @vicoplus/mcp-chrome-bridge register', 'yellow'));
                console.log((0, utils_1.colorText)('  2. @vicoplus/mcp-chrome-bridge register --system', 'yellow'));
                process.exit(1);
            }
        }
    }
    catch (error) {
        console.error((0, utils_1.colorText)(`Registration failed: ${error.message}`, 'red'));
        process.exit(1);
    }
});
// Fix execution permissions
commander_1.program
    .command('fix-permissions')
    .description('Fix execution permissions for native host files')
    .action(async () => {
    try {
        console.log((0, utils_1.colorText)('Fixing execution permissions...', 'blue'));
        await (0, utils_1.ensureExecutionPermissions)();
        console.log((0, utils_1.colorText)('✓ Execution permissions fixed successfully!', 'green'));
    }
    catch (error) {
        console.error((0, utils_1.colorText)(`Failed to fix permissions: ${error.message}`, 'red'));
        process.exit(1);
    }
});
// Update port in stdio-config.json
commander_1.program
    .command('update-port <port>')
    .description('Update the port number in stdio-config.json')
    .action(async (port) => {
    try {
        const portNumber = parseInt(port, 10);
        if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
            console.error((0, utils_1.colorText)('Error: Port must be a valid number between 1 and 65535', 'red'));
            process.exit(1);
        }
        const configPath = path.join(__dirname, 'mcp', 'stdio-config.json');
        if (!fs.existsSync(configPath)) {
            console.error((0, utils_1.colorText)(`Error: Configuration file not found at ${configPath}`, 'red'));
            process.exit(1);
        }
        const configData = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configData);
        const currentUrl = new URL(config.url);
        currentUrl.port = portNumber.toString();
        config.url = currentUrl.toString();
        fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
        console.log((0, utils_1.colorText)(`✓ Port updated successfully to ${portNumber}`, 'green'));
        console.log((0, utils_1.colorText)(`Updated URL: ${config.url}`, 'blue'));
    }
    catch (error) {
        console.error((0, utils_1.colorText)(`Failed to update port: ${error.message}`, 'red'));
        process.exit(1);
    }
});
commander_1.program.parse(process.argv);
// If no command provided, show help
if (!process.argv.slice(2).length) {
    commander_1.program.outputHelp();
}
//# sourceMappingURL=cli.js.map