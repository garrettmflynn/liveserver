export default devices;
declare var devices: ({
    label: string;
    video: boolean;
    audio?: undefined;
    device?: undefined;
    onconnect?: undefined;
    ondata?: undefined;
    url?: undefined;
    protocols?: undefined;
    bufferSize?: undefined;
    namePrefix?: undefined;
    serviceUUID?: undefined;
    characteristics?: undefined;
    usbVendorId?: undefined;
    usbProductId?: undefined;
    serialOptions?: undefined;
    oninit?: undefined;
    serial?: undefined;
    modes?: undefined;
} | {
    label: string;
    audio: boolean;
    video?: undefined;
    device?: undefined;
    onconnect?: undefined;
    ondata?: undefined;
    url?: undefined;
    protocols?: undefined;
    bufferSize?: undefined;
    namePrefix?: undefined;
    serviceUUID?: undefined;
    characteristics?: undefined;
    usbVendorId?: undefined;
    usbProductId?: undefined;
    serialOptions?: undefined;
    oninit?: undefined;
    serial?: undefined;
    modes?: undefined;
} | {
    label: string;
    device: typeof webgazer.Webgazer;
    onconnect: (dataDevice: import("./Device").Device<webgazer.Webgazer>) => Promise<void>;
    video?: undefined;
    audio?: undefined;
    ondata?: undefined;
    url?: undefined;
    protocols?: undefined;
    bufferSize?: undefined;
    namePrefix?: undefined;
    serviceUUID?: undefined;
    characteristics?: undefined;
    usbVendorId?: undefined;
    usbProductId?: undefined;
    serialOptions?: undefined;
    oninit?: undefined;
    serial?: undefined;
    modes?: undefined;
} | {
    label: string;
    ondata: (decoded: string) => number[];
    url: string;
    protocols: string[];
    video?: undefined;
    audio?: undefined;
    device?: undefined;
    onconnect?: undefined;
    bufferSize?: undefined;
    namePrefix?: undefined;
    serviceUUID?: undefined;
    characteristics?: undefined;
    usbVendorId?: undefined;
    usbProductId?: undefined;
    serialOptions?: undefined;
    oninit?: undefined;
    serial?: undefined;
    modes?: undefined;
} | {
    label: string;
    ondata: (newline: string) => {
        [x: string]: any[];
    };
    onconnect: (arg1: any, arg2: any) => void;
    bufferSize: number;
    namePrefix: string;
    serviceUUID: string;
    characteristics: {
        transmit: string;
        receive: string;
    };
    usbVendorId: number;
    usbProductId: number;
    serialOptions: {
        bufferSize: number;
        baudRate: number;
    };
    video?: undefined;
    audio?: undefined;
    device?: undefined;
    url?: undefined;
    protocols?: undefined;
    oninit?: undefined;
    serial?: undefined;
    modes?: undefined;
} | {
    label: string;
    oninit: (device: import("./Device").Device<any>) => void;
    ondata: (buffer: Uint8Array) => {
        [x: string]: any;
    };
    usbVendorId: number;
    usbProductId: number;
    serial: {
        baudRate: number;
        bufferSize: number;
    };
    modes: string[];
    video?: undefined;
    audio?: undefined;
    device?: undefined;
    onconnect?: undefined;
    url?: undefined;
    protocols?: undefined;
    bufferSize?: undefined;
    namePrefix?: undefined;
    serviceUUID?: undefined;
    characteristics?: undefined;
    serialOptions?: undefined;
} | {
    label: string;
    device: typeof import("muse-js").MuseClient;
    onconnect: (dataDevice: import("./Device").Device<import("muse-js").MuseClient>) => Promise<void>;
    protocols: string[];
    video?: undefined;
    audio?: undefined;
    ondata?: undefined;
    url?: undefined;
    bufferSize?: undefined;
    namePrefix?: undefined;
    serviceUUID?: undefined;
    characteristics?: undefined;
    usbVendorId?: undefined;
    usbProductId?: undefined;
    serialOptions?: undefined;
    oninit?: undefined;
    serial?: undefined;
    modes?: undefined;
})[];
import * as webgazer from "./webgazer/index";
