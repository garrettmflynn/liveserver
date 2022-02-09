import { DataStream } from './DataStream';
import { Bluetooth as BluetoothDevice } from '../devices/Bluetooth.device';
import { SerialDevice } from '../devices/Serial.device';
import { Device } from '../devices/Device';
import { DataTrackSupportedConstraints } from './DataTrackSupportedConstraints';
import { DeviceType, DeviceConstraintsType } from '../types/Devices.types';
import { WebSocketDevice } from '../devices/WebSocket.device';
/**
 * The DataDevices interface provides access to data sources like webcams, microphones, and BLE / USB devices.
 * ```typescript
 * import { DataDevices } from "datastreams-api";
 *
 * const dataDevices = new DataDevices();
 * ```
 */
export declare class DataDevices extends EventTarget {
    devices: DeviceType[];
    get [Symbol.toStringTag](): string;
    constructor();
    load: (devices: DeviceConstraintsType<any> | DeviceConstraintsType<any>[]) => void;
    enumerateDevices: () => Promise<any[]>;
    getSupportedDevices: (filter?: "data" | "media" | undefined) => Promise<any[]>;
    getDeviceInfo: (constraints: DeviceConstraintsType) => {
        deviceId: string;
        groupId: string;
        kind: any;
        label: any;
        protocols: string[];
        modes: any;
    };
    getSupportedConstraints: () => Promise<DataTrackSupportedConstraints>;
    getDevice: (constraints: DeviceConstraintsType<any>) => BluetoothDevice<any> | SerialDevice<any> | WebSocketDevice<any> | undefined;
    startDataStream: (constraints: DeviceConstraintsType<any>, stream?: DataStream) => Promise<Device<any> | SerialDevice<any> | WebSocketDevice<any>>;
    getUserStream: (constraints: DeviceConstraintsType) => Promise<Device<any> | SerialDevice<any> | WebSocketDevice<any>>;
}
