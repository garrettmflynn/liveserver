import { Device } from "../Device";
export declare const onconnect: (dataDevice: Device<Webgazer>) => Promise<void>;
export declare class Webgazer {
    device: any | null;
    callbacks: Function[];
    constructor();
    handleScriptLoad: (onload: Function) => Promise<void>;
    checkWebGazerLoaded: (onload: Function) => void;
    startWebgazer(webgazer: any): void;
    connect: () => Promise<unknown>;
    disconnect: () => void;
    subscribe: (f: Function) => void;
}
