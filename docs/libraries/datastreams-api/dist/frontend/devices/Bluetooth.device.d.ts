/// <reference types="web-bluetooth" />
/***************************************************
 This is a React WebApp written to Flash an ESP32 via BLE

Written by Andrew England (SparkFun)
BSD license, all text above must be included in any redistribution.
*****************************************************/
import { Device } from "./Device";
import { DeviceConstraintsType } from '../types/Devices.types';
export declare class Bluetooth<T = any> extends Device<T> {
    source?: BluetoothDevice;
    characteristics: {
        [x: string]: BluetoothRemoteGATTCharacteristic;
    };
    server?: BluetoothRemoteGATTServer;
    service?: BluetoothRemoteGATTService;
    transmitCharacteristic?: BluetoothRemoteGATTCharacteristic;
    constructor(constraints: DeviceConstraintsType);
    connect: () => Promise<void>;
    _disconnect: () => Promise<void>;
    send: (msg: any, charName: any) => Promise<void>;
    onnotification: (e: any, charName: string) => void;
    connectCharacteristic: (name: string, value: any) => Promise<any>;
}
