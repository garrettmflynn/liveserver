/**
 *
 * Create a TransformStream for sensor data | modeled after the Insertable Streams API
 *
 */
export declare class DataStreamTrackTransform {
    transform: TransformStream;
    constructor(dict: {
        transform: (value: any, controller: TransformStreamDefaultController) => Promise<any>;
    });
}
