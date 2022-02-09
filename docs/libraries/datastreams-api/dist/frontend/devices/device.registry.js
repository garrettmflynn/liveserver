import * as hegduino from './hegduino/index';
import * as freeeeg from './freeeeg/index';
import * as muse from './muse/index';
import * as webgazer from './webgazer/index';
// import * as bci2000web from './bci2000web/index'
import * as remote from '../../common/source.device';
// let audioDevices:string[] = [], videoDevices:string[] = [];
// navigator.mediaDevices.enumerateDevices().then(mediaDevices => {
//     let audioIns = mediaDevices.filter(d => d.kind === 'audioinput')
//     let videoIns = mediaDevices.filter(d => d.kind === 'videoinput')
//     audioDevices.push(...audioIns.map(o => o.label))
//     videoDevices.push(...videoIns.map(o => o.label))
//     console.log(mediaDevices)
//     console.log(audioDevices)
//     console.log(videoDevices)
// })
// Supported Devices
var devices = [
    // ----------------------------------  WebSocket "Device" ----------------------------------
    {
        label: 'Video',
        video: true,
    },
    {
        label: 'Audio',
        audio: true,
    },
    {
        label: 'Webgazer',
        device: webgazer.Webgazer,
        onconnect: webgazer.onconnect,
    },
    // ----------------------------------  WebSocket "Device" ----------------------------------
    {
        // Generic 
        label: 'Remote',
        ondata: remote.ondata,
        // URL
        url: 'http://localhost',
        protocols: ['websocket'],
    },
    // ----------------------------------  Device with Auto-Generated Connection Scripts ----------------------------------
    {
        // Generic 
        label: 'HEGduino',
        ondata: hegduino.ondata,
        onconnect: hegduino.onconnect,
        bufferSize: 500,
        // Bluetooth
        namePrefix: 'HEG',
        serviceUUID: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
        characteristics: {
            transmit: '6e400003-b5a3-f393-e0a9-e50e24dcca9e',
            receive: '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
        },
        // Serial / USB
        usbVendorId: 4292,
        usbProductId: 60000,
        serialOptions: {
            bufferSize: 1000,
            baudRate: 115200
        },
    },
    {
        // Generic 
        label: 'FreeEEG',
        oninit: freeeeg.oninit,
        ondata: freeeeg.ondata,
        usbVendorId: 0x10c4,
        usbProductId: 0x0043,
        serial: {
            baudRate: 115200,
            bufferSize: 2000,
        },
        // Additional Metadata
        modes: ['optical', 'ads131', 'freeeeg32_2', 'freeeeg32_19'] // oninit
    },
    // ---------------------------------- Device with Pre-Built Connection Scripts ----------------------------------
    {
        // Generic 
        label: 'Muse',
        device: muse.device,
        onconnect: muse.onconnect,
        protocols: ['bluetooth'], // must specify to list connection types
    },
];
export default devices;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV2aWNlLnJlZ2lzdHJ5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vZGV2aWNlcy9kZXZpY2UucmVnaXN0cnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxLQUFLLFFBQVEsTUFBTSxrQkFBa0IsQ0FBQTtBQUM1QyxPQUFPLEtBQUssT0FBTyxNQUFNLGlCQUFpQixDQUFBO0FBQzFDLE9BQU8sS0FBSyxJQUFJLE1BQU0sY0FBYyxDQUFBO0FBQ3BDLE9BQU8sS0FBSyxRQUFRLE1BQU0sa0JBQWtCLENBQUE7QUFDNUMsbURBQW1EO0FBQ25ELE9BQU8sS0FBSyxNQUFNLE1BQU0sNEJBQTRCLENBQUE7QUFHcEQsOERBQThEO0FBQzlELG1FQUFtRTtBQUNuRSx1RUFBdUU7QUFDdkUsdUVBQXVFO0FBRXZFLHVEQUF1RDtBQUN2RCx1REFBdUQ7QUFDdkQsZ0NBQWdDO0FBRWhDLGdDQUFnQztBQUNoQyxnQ0FBZ0M7QUFFaEMsS0FBSztBQUVMLG9CQUFvQjtBQUNwQixJQUFNLE9BQU8sR0FBNEI7SUFDakMsNEZBQTRGO0lBQzVGO1FBQ0ksS0FBSyxFQUFFLE9BQU87UUFDZCxLQUFLLEVBQUUsSUFBSTtLQUNmO0lBRUQ7UUFDQyxLQUFLLEVBQUUsT0FBTztRQUNkLEtBQUssRUFBRSxJQUFJO0tBQ1Y7SUFFRDtRQUNLLEtBQUssRUFBRSxVQUFVO1FBQ2pCLE1BQU0sRUFBRSxRQUFRLENBQUMsUUFBUTtRQUN6QixTQUFTLEVBQUUsUUFBUSxDQUFDLFNBQVM7S0FDakM7SUFHRCw0RkFBNEY7SUFFNUY7UUFDSSxXQUFXO1FBQ1gsS0FBSyxFQUFFLFFBQVE7UUFDZixNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU07UUFFckIsTUFBTTtRQUNOLEdBQUcsRUFBRSxrQkFBa0I7UUFFdkIsU0FBUyxFQUFFLENBQUMsV0FBVyxDQUFDO0tBRTNCO0lBQ0wsdUhBQXVIO0lBRXZIO1FBQ0ksV0FBVztRQUNYLEtBQUssRUFBRSxVQUFVO1FBQ2pCLE1BQU0sRUFBRSxRQUFRLENBQUMsTUFBTTtRQUN2QixTQUFTLEVBQUUsUUFBUSxDQUFDLFNBQVM7UUFDN0IsVUFBVSxFQUFFLEdBQUc7UUFFZixZQUFZO1FBQ1osVUFBVSxFQUFFLEtBQUs7UUFDakIsV0FBVyxFQUFFLHNDQUFzQztRQUNuRCxlQUFlLEVBQUU7WUFDYixRQUFRLEVBQUUsc0NBQXNDO1lBQ2hELE9BQU8sRUFBRSxzQ0FBc0M7U0FDbEQ7UUFFRCxlQUFlO1FBQ2YsV0FBVyxFQUFFLElBQUk7UUFDakIsWUFBWSxFQUFFLEtBQUs7UUFDbkIsYUFBYSxFQUFFO1lBQ1gsVUFBVSxFQUFFLElBQUk7WUFDaEIsUUFBUSxFQUFFLE1BQU07U0FDbkI7S0FDSjtJQUVEO1FBQ0ksV0FBVztRQUNYLEtBQUssRUFBRSxTQUFTO1FBQ2hCLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBTTtRQUN0QixNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQU07UUFFdEIsV0FBVyxFQUFFLE1BQU07UUFDbkIsWUFBWSxFQUFFLE1BQU07UUFDcEIsTUFBTSxFQUFFO1lBQ0osUUFBUSxFQUFFLE1BQU07WUFDaEIsVUFBVSxFQUFFLElBQUk7U0FDbkI7UUFFRCxzQkFBc0I7UUFDdEIsS0FBSyxFQUFFLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxhQUFhLEVBQUUsY0FBYyxDQUFDLENBQUMsU0FBUztLQUN4RTtJQUVELGlIQUFpSDtJQUU3RztRQUNJLFdBQVc7UUFDWCxLQUFLLEVBQUUsTUFBTTtRQUNiLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtRQUNuQixTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVM7UUFDekIsU0FBUyxFQUFFLENBQUMsV0FBVyxDQUFDLEVBQUUsd0NBQXdDO0tBRXJFO0NBQ1IsQ0FBQTtBQUVELGVBQWUsT0FBTyxDQUFBIn0=