"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeFile = exports.mkdir = exports.access = void 0;
exports.colorText = colorText;
exports.getUserManifestPath = getUserManifestPath;
exports.getSystemManifestPath = getSystemManifestPath;
exports.getMainPath = getMainPath;
exports.ensureExecutionPermissions = ensureExecutionPermissions;
exports.createManifestContent = createManifestContent;
exports.tryRegisterUserLevelHost = tryRegisterUserLevelHost;
exports.registerWithElevatedPermissions = registerWithElevatedPermissions;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const constant_1 = require("./constant");
exports.access = (0, util_1.promisify)(fs_1.default.access);
exports.mkdir = (0, util_1.promisify)(fs_1.default.mkdir);
exports.writeFile = (0, util_1.promisify)(fs_1.default.writeFile);
/**
 * 打印彩色文本
 */
function colorText(text, color) {
    const colors = {
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        reset: '\x1b[0m',
    };
    return colors[color] + text + colors.reset;
}
/**
 * Get user-level manifest file path
 */
function getUserManifestPath() {
    if (os_1.default.platform() === 'win32') {
        // Windows: %APPDATA%\Google\Chrome\NativeMessagingHosts\
        return path_1.default.join(process.env.APPDATA || path_1.default.join(os_1.default.homedir(), 'AppData', 'Roaming'), 'Google', 'Chrome', 'NativeMessagingHosts', `${constant_1.HOST_NAME}.json`);
    }
    else if (os_1.default.platform() === 'darwin') {
        // macOS: ~/Library/Application Support/Google/Chrome/NativeMessagingHosts/
        return path_1.default.join(os_1.default.homedir(), 'Library', 'Application Support', 'Google', 'Chrome', 'NativeMessagingHosts', `${constant_1.HOST_NAME}.json`);
    }
    else {
        // Linux: ~/.config/google-chrome/NativeMessagingHosts/
        return path_1.default.join(os_1.default.homedir(), '.config', 'google-chrome', 'NativeMessagingHosts', `${constant_1.HOST_NAME}.json`);
    }
}
/**
 * Get system-level manifest file path
 */
function getSystemManifestPath() {
    if (os_1.default.platform() === 'win32') {
        // Windows: %ProgramFiles%\Google\Chrome\NativeMessagingHosts\
        return path_1.default.join(process.env.ProgramFiles || 'C:\\Program Files', 'Google', 'Chrome', 'NativeMessagingHosts', `${constant_1.HOST_NAME}.json`);
    }
    else if (os_1.default.platform() === 'darwin') {
        // macOS: /Library/Google/Chrome/NativeMessagingHosts/
        return path_1.default.join('/Library', 'Google', 'Chrome', 'NativeMessagingHosts', `${constant_1.HOST_NAME}.json`);
    }
    else {
        // Linux: /etc/opt/chrome/native-messaging-hosts/
        return path_1.default.join('/etc', 'opt', 'chrome', 'native-messaging-hosts', `${constant_1.HOST_NAME}.json`);
    }
}
/**
 * Get native host startup script file path
 */
async function getMainPath() {
    try {
        const packageDistDir = path_1.default.join(__dirname, '..');
        const wrapperScriptName = process.platform === 'win32' ? 'run_host.bat' : 'run_host.sh';
        const absoluteWrapperPath = path_1.default.resolve(packageDistDir, wrapperScriptName);
        return absoluteWrapperPath;
    }
    catch (error) {
        console.log(colorText('Cannot find global package path, using current directory', 'yellow'));
        throw error;
    }
}
/**
 * 确保关键文件具有执行权限
 */
async function ensureExecutionPermissions() {
    try {
        const packageDistDir = path_1.default.join(__dirname, '..');
        if (process.platform === 'win32') {
            // Windows 平台处理
            await ensureWindowsFilePermissions(packageDistDir);
            return;
        }
        // Unix/Linux 平台处理
        const filesToCheck = [
            path_1.default.join(packageDistDir, 'index.js'),
            path_1.default.join(packageDistDir, 'run_host.sh'),
            path_1.default.join(packageDistDir, 'cli.js'),
        ];
        for (const filePath of filesToCheck) {
            if (fs_1.default.existsSync(filePath)) {
                try {
                    fs_1.default.chmodSync(filePath, '755');
                    console.log(colorText(`✓ Set execution permissions for ${path_1.default.basename(filePath)}`, 'green'));
                }
                catch (err) {
                    console.warn(colorText(`⚠️ Unable to set execution permissions for ${path_1.default.basename(filePath)}: ${err.message}`, 'yellow'));
                }
            }
            else {
                console.warn(colorText(`⚠️ File not found: ${filePath}`, 'yellow'));
            }
        }
    }
    catch (error) {
        console.warn(colorText(`⚠️ Error ensuring execution permissions: ${error.message}`, 'yellow'));
    }
}
/**
 * Windows 平台文件权限处理
 */
async function ensureWindowsFilePermissions(packageDistDir) {
    const filesToCheck = [
        path_1.default.join(packageDistDir, 'index.js'),
        path_1.default.join(packageDistDir, 'run_host.bat'),
        path_1.default.join(packageDistDir, 'cli.js'),
    ];
    for (const filePath of filesToCheck) {
        if (fs_1.default.existsSync(filePath)) {
            try {
                // 检查文件是否为只读，如果是则移除只读属性
                const stats = fs_1.default.statSync(filePath);
                if (!(stats.mode & parseInt('200', 8))) {
                    // 检查写权限
                    // 尝试移除只读属性
                    fs_1.default.chmodSync(filePath, stats.mode | parseInt('200', 8));
                    console.log(colorText(`✓ Removed read-only attribute from ${path_1.default.basename(filePath)}`, 'green'));
                }
                // 验证文件可读性
                fs_1.default.accessSync(filePath, fs_1.default.constants.R_OK);
                console.log(colorText(`✓ Verified file accessibility for ${path_1.default.basename(filePath)}`, 'green'));
            }
            catch (err) {
                console.warn(colorText(`⚠️ Unable to verify file permissions for ${path_1.default.basename(filePath)}: ${err.message}`, 'yellow'));
            }
        }
        else {
            console.warn(colorText(`⚠️ File not found: ${filePath}`, 'yellow'));
        }
    }
}
/**
 * Create Native Messaging host manifest content
 */
async function createManifestContent() {
    const mainPath = await getMainPath();
    return {
        name: constant_1.HOST_NAME,
        description: constant_1.DESCRIPTION,
        path: mainPath, // Node.js可执行文件路径
        type: 'stdio',
        allowed_origins: [`chrome-extension://${constant_1.EXTENSION_ID}/`],
    };
}
/**
 * 验证Windows注册表项是否存在
 */
function verifyWindowsRegistryEntry(registryKey, expectedPath) {
    if (os_1.default.platform() !== 'win32') {
        return true; // 非Windows平台跳过验证
    }
    try {
        const result = (0, child_process_1.execSync)(`reg query "${registryKey}" /ve`, { encoding: 'utf8', stdio: 'pipe' });
        const lines = result.split('\n');
        for (const line of lines) {
            if (line.includes('REG_SZ') && line.includes(expectedPath.replace(/\\/g, '\\\\'))) {
                return true;
            }
        }
        return false;
    }
    catch (error) {
        return false;
    }
}
/**
 * 尝试注册用户级别的Native Messaging主机
 */
async function tryRegisterUserLevelHost() {
    try {
        console.log(colorText('Attempting to register user-level Native Messaging host...', 'blue'));
        // 1. 确保执行权限
        await ensureExecutionPermissions();
        // 2. 确定清单文件路径
        const manifestPath = getUserManifestPath();
        // 3. 确保目录存在
        await (0, exports.mkdir)(path_1.default.dirname(manifestPath), { recursive: true });
        // 4. 创建清单内容
        const manifest = await createManifestContent();
        console.log('manifest path==>', manifest, manifestPath);
        // 5. 写入清单文件
        await (0, exports.writeFile)(manifestPath, JSON.stringify(manifest, null, 2));
        if (os_1.default.platform() === 'win32') {
            const registryKey = `HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\${constant_1.HOST_NAME}`;
            try {
                // 确保路径使用正确的转义格式
                const escapedPath = manifestPath.replace(/\\/g, '\\\\');
                const regCommand = `reg add "${registryKey}" /ve /t REG_SZ /d "${escapedPath}" /f`;
                console.log(colorText(`Executing registry command: ${regCommand}`, 'blue'));
                (0, child_process_1.execSync)(regCommand, { stdio: 'pipe' });
                // 验证注册表项是否创建成功
                if (verifyWindowsRegistryEntry(registryKey, manifestPath)) {
                    console.log(colorText('✓ Successfully created Windows registry entry', 'green'));
                }
                else {
                    console.log(colorText('⚠️ Registry entry created but verification failed', 'yellow'));
                }
            }
            catch (error) {
                console.log(colorText(`⚠️ Unable to create Windows registry entry: ${error.message}`, 'yellow'));
                console.log(colorText(`Registry key: ${registryKey}`, 'yellow'));
                console.log(colorText(`Manifest path: ${manifestPath}`, 'yellow'));
                return false; // Windows上如果注册表项创建失败，整个注册过程应该视为失败
            }
        }
        console.log(colorText('Successfully registered user-level Native Messaging host!', 'green'));
        return true;
    }
    catch (error) {
        console.log(colorText(`User-level registration failed: ${error instanceof Error ? error.message : String(error)}`, 'yellow'));
        return false;
    }
}
// 导入is-admin包（仅在Windows平台使用）
let isAdmin = () => false;
if (process.platform === 'win32') {
    try {
        isAdmin = require('is-admin');
    }
    catch (error) {
        console.warn('缺少is-admin依赖，Windows平台下可能无法正确检测管理员权限');
        console.warn(error);
    }
}
/**
 * 使用提升权限注册系统级清单
 */
async function registerWithElevatedPermissions() {
    try {
        console.log(colorText('Attempting to register system-level manifest...', 'blue'));
        // 1. 确保执行权限
        await ensureExecutionPermissions();
        // 2. 准备清单内容
        const manifest = await createManifestContent();
        // 3. 获取系统级清单路径
        const manifestPath = getSystemManifestPath();
        // 4. 创建临时清单文件
        const tempManifestPath = path_1.default.join(os_1.default.tmpdir(), `${constant_1.HOST_NAME}.json`);
        await (0, exports.writeFile)(tempManifestPath, JSON.stringify(manifest, null, 2));
        // 5. 检测是否已经有管理员权限
        const isRoot = process.getuid && process.getuid() === 0; // Unix/Linux/Mac
        const hasAdminRights = process.platform === 'win32' ? isAdmin() : false; // Windows平台检测管理员权限
        const hasElevatedPermissions = isRoot || hasAdminRights;
        // 准备命令
        const command = os_1.default.platform() === 'win32'
            ? `if not exist "${path_1.default.dirname(manifestPath)}" mkdir "${path_1.default.dirname(manifestPath)}" && copy "${tempManifestPath}" "${manifestPath}"`
            : `mkdir -p "${path_1.default.dirname(manifestPath)}" && cp "${tempManifestPath}" "${manifestPath}" && chmod 644 "${manifestPath}"`;
        if (hasElevatedPermissions) {
            // 已经有管理员权限，直接执行命令
            try {
                // 创建目录
                if (!fs_1.default.existsSync(path_1.default.dirname(manifestPath))) {
                    fs_1.default.mkdirSync(path_1.default.dirname(manifestPath), { recursive: true });
                }
                // 复制文件
                fs_1.default.copyFileSync(tempManifestPath, manifestPath);
                // 设置权限（非Windows平台）
                if (os_1.default.platform() !== 'win32') {
                    fs_1.default.chmodSync(manifestPath, '644');
                }
                console.log(colorText('System-level manifest registration successful!', 'green'));
            }
            catch (error) {
                console.error(colorText(`System-level manifest installation failed: ${error.message}`, 'red'));
                throw error;
            }
        }
        else {
            // 没有管理员权限，打印手动操作提示
            console.log(colorText('⚠️ Administrator privileges required for system-level installation', 'yellow'));
            console.log(colorText('Please run one of the following commands with administrator privileges:', 'blue'));
            if (os_1.default.platform() === 'win32') {
                console.log(colorText('  1. Open Command Prompt as Administrator and run:', 'blue'));
                console.log(colorText(`     ${command}`, 'cyan'));
            }
            else {
                console.log(colorText('  1. Run with sudo:', 'blue'));
                console.log(colorText(`     sudo ${command}`, 'cyan'));
            }
            console.log(colorText('  2. Or run the registration command with elevated privileges:', 'blue'));
            console.log(colorText(`     sudo ${constant_1.COMMAND_NAME} register --system`, 'cyan'));
            throw new Error('Administrator privileges required for system-level installation');
        }
        // 6. Windows特殊处理 - 设置系统级注册表
        if (os_1.default.platform() === 'win32') {
            const registryKey = `HKLM\\Software\\Google\\Chrome\\NativeMessagingHosts\\${constant_1.HOST_NAME}`;
            // 确保路径使用正确的转义格式
            const escapedPath = manifestPath.replace(/\\/g, '\\\\');
            const regCommand = `reg add "${registryKey}" /ve /t REG_SZ /d "${escapedPath}" /f`;
            console.log(colorText(`Creating system registry entry: ${registryKey}`, 'blue'));
            console.log(colorText(`Manifest path: ${manifestPath}`, 'blue'));
            if (hasElevatedPermissions) {
                // 已经有管理员权限，直接执行注册表命令
                try {
                    (0, child_process_1.execSync)(regCommand, { stdio: 'pipe' });
                    // 验证注册表项是否创建成功
                    if (verifyWindowsRegistryEntry(registryKey, manifestPath)) {
                        console.log(colorText('Windows registry entry created successfully!', 'green'));
                    }
                    else {
                        console.log(colorText('⚠️ Registry entry created but verification failed', 'yellow'));
                    }
                }
                catch (error) {
                    console.error(colorText(`Windows registry entry creation failed: ${error.message}`, 'red'));
                    console.error(colorText(`Command: ${regCommand}`, 'red'));
                    throw error;
                }
            }
            else {
                // 没有管理员权限，打印手动操作提示
                console.log(colorText('⚠️ Administrator privileges required for Windows registry modification', 'yellow'));
                console.log(colorText('Please run the following command as Administrator:', 'blue'));
                console.log(colorText(`  ${regCommand}`, 'cyan'));
                console.log(colorText('Or run the registration command with elevated privileges:', 'blue'));
                console.log(colorText(`  Run Command Prompt as Administrator and execute: ${constant_1.COMMAND_NAME} register --system`, 'cyan'));
                throw new Error('Administrator privileges required for Windows registry modification');
            }
        }
    }
    catch (error) {
        console.error(colorText(`注册失败: ${error.message}`, 'red'));
        throw error;
    }
}
//# sourceMappingURL=utils.js.map