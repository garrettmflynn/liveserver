/// <reference types="w3c-web-serial" />
import { DataStream } from '../core/DataStream';
import { Device } from '../devices/Device';
export declare type CoreDeviceType<T = any> = T & {
    constructor?: Function;
    connect?: Function;
    disconnect?: Function;
};
export declare type DeviceType<T = any> = CoreDeviceType<T> & {
    label: string;
    kind: string;
    protocols?: string[];
    modes?: string[];
    bufferSize?: number;
    ondata?: (data: any, name?: string) => (any[] | {
        [x: string | number]: any;
    });
    encode?: (data: any, name?: string) => any;
    decode?: (data: any, name?: string) => any;
    oninit?: (target: any) => Promise<any>;
    onconnect?: (target: any) => Promise<any>;
    ondisconnect?: (target: any) => Promise<any>;
    onerror?: (error: Error) => Promise<any>;
    namePrefix?: string;
    serviceUUID?: string;
    characteristics?: {
        [x: string]: string;
    };
    usbVendorId?: number | string;
    usbProductId?: number | string;
    url?: string;
};
export declare type DeviceConstraintsType<T = any> = DeviceType<T> & {
    stream?: DataStream;
    device?: Device<T> | CoreDeviceType;
    serialOptions?: Partial<SerialOptions>;
    mode?: string;
    protocol?: string | string[];
};
