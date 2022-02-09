/// <reference types="w3c-web-serial" />
import { Device } from './Device';
import { DeviceConstraintsType } from '../types/Devices.types';
export declare class SerialDevice<T = any> extends Device<T> {
    displayPorts: any[];
    encodedBuffer: string;
    connected: boolean;
    recordData: boolean;
    recorded: any[];
    port: any;
    decoder: TextDecoder;
    subscribed: boolean;
    readable: ReadableStream | null;
    writer: WritableStream | null;
    monitoring: boolean;
    newSamples: number;
    monitorSamples: number;
    monitorData: any[];
    monitorIdx: number;
    constructor(constraints: DeviceConstraintsType);
    connect: () => Promise<void>;
    send: (msg: string) => Promise<void>;
    subscribe: (port?: SerialPort) => Promise<boolean>;
    handleError: (error: Error) => Promise<void>;
    onPortSelected: (port: SerialPort) => Promise<void>;
    onReceive: (input: ArrayBufferView | ArrayBuffer | undefined) => void;
    _disconnect: () => Promise<void>;
    closePort: (port?: any) => Promise<void>;
}
