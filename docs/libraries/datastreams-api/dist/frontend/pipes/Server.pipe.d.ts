import { Pipe } from "./Pipe";
import { PipeSettingsType } from '../types/Pipes.types';
import { Websocket } from '../utils/WebSocket';
import { DataType } from 'src/common/types/Data.types';
export declare class ServerPipe extends Pipe {
    get [Symbol.toStringTag](): string;
    queue: any[];
    socket?: Websocket;
    readyForData: boolean;
    constructor(settings: PipeSettingsType);
    send: (o: DataType) => Promise<DataType>;
    sendData: (data: any[]) => Promise<DataType>;
    process: (args: any[]) => Promise<any>;
    transform: (chunk: any, controller: TransformStreamDefaultController) => Promise<void>;
}
