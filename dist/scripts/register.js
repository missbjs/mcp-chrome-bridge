#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constant_1 = require("./constant");
const utils_1 = require("./utils");
/**
 * 主函数
 */
async function main() {
    console.log((0, utils_1.colorText)(`正在注册 ${constant_1.COMMAND_NAME} Native Messaging主机...`, 'blue'));
    try {
        await (0, utils_1.registerWithElevatedPermissions)();
        console.log((0, utils_1.colorText)('注册成功！现在Chrome扩展可以通过Native Messaging与本地服务通信。', 'green'));
    }
    catch (error) {
        console.error((0, utils_1.colorText)(`注册失败: ${error.message}`, 'red'));
        process.exit(1);
    }
}
// 执行主函数
main();
//# sourceMappingURL=register.js.map