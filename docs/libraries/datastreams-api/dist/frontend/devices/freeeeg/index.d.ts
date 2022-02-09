import { Device } from "../Device";
export declare const oninit: (device: Device<any>) => void;
export declare const ondata: (buffer: Uint8Array) => {
    [x: string]: any;
};
