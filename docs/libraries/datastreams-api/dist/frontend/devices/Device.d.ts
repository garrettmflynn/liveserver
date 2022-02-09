import { DataStream } from "../core/DataStream";
import { CoreDeviceType, DeviceConstraintsType } from "../types/Devices.types";
export declare class Device<T> {
    id: string;
    _ondata: (data: any, name?: string) => (any[] | {
        [x: string | number]: any;
    });
    constraints: DeviceConstraintsType<T>;
    device: CoreDeviceType<T>;
    stream?: DataStream;
    encoder: TextEncoder | any;
    decoder: TextDecoder | any;
    active: boolean;
    constructor(constraints: DeviceConstraintsType<T>);
    init: (constraints?: Partial<any> | undefined) => void;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    _connect: () => Promise<void>;
    _disconnect: () => Promise<void>;
    send: (msg: any, from: any) => Promise<any>;
    encode: (msg: any, _: string) => any;
    decode: (msg: any, _: string) => any;
    oninit: (target?: Device<T>) => Promise<void>;
    onconnect: (target?: Device<T>) => Promise<void>;
    ondisconnect: (target?: Device<T>) => Promise<void>;
    onsend: (msg?: any, from?: any) => Promise<void>;
    onerror: (err: Error) => Promise<void>;
    ondata: (data: any, charName?: string | undefined) => void;
    private _createTrack;
}
