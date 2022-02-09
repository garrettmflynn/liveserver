export declare type DeviceRequestType = {
    videoinput?: boolean;
    audioinput?: boolean;
    audiooutput?: boolean;
    datainput?: boolean;
    dataoutput?: boolean;
};
export declare type MessageType = {
    data: {
        cmd: string;
        data: any;
    };
};
