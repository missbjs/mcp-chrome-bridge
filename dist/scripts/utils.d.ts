import fs from 'fs';
export declare const access: typeof fs.access.__promisify__;
export declare const mkdir: typeof fs.mkdir.__promisify__;
export declare const writeFile: typeof fs.writeFile.__promisify__;
/**
 * 打印彩色文本
 */
export declare function colorText(text: string, color: string): string;
/**
 * Get user-level manifest file path
 */
export declare function getUserManifestPath(): string;
/**
 * Get system-level manifest file path
 */
export declare function getSystemManifestPath(): string;
/**
 * Get native host startup script file path
 */
export declare function getMainPath(): Promise<string>;
/**
 * 确保关键文件具有执行权限
 */
export declare function ensureExecutionPermissions(): Promise<void>;
/**
 * Create Native Messaging host manifest content
 */
export declare function createManifestContent(): Promise<any>;
/**
 * 尝试注册用户级别的Native Messaging主机
 */
export declare function tryRegisterUserLevelHost(): Promise<boolean>;
/**
 * 使用提升权限注册系统级清单
 */
export declare function registerWithElevatedPermissions(): Promise<void>;
