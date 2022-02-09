import { Device } from 'src/frontend/devices/Device';
export declare const label = "Dummy Source";
export declare const kind = "datainput";
export declare const ondata: (decoded: string) => number[];
export declare const onconnect: (device: Device<any>) => Promise<boolean>;
export declare const ondisconnect: () => Promise<boolean>;
