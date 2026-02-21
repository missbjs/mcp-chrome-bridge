import { FastifyInstance } from 'fastify';
import { NativeMessagingHost } from '../native-messaging-host';
export declare class Server {
    private fastify;
    isRunning: boolean;
    private nativeHost;
    private transportsMap;
    constructor();
    /**
     * Associate NativeMessagingHost instance
     */
    setNativeHost(nativeHost: NativeMessagingHost): void;
    private setupPlugins;
    private setupRoutes;
    start(port: number | undefined, nativeHost: NativeMessagingHost): Promise<void>;
    stop(): Promise<void>;
    getInstance(): FastifyInstance;
}
declare const serverInstance: Server;
export default serverInstance;
