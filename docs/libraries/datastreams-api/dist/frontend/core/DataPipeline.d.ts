/// <reference types="dom-mediacapture-transform" />
import { DataStreamTrackGenerator } from "./DataStreamTrackGenerator";
import { DataStreamTrack } from './DataStreamTrack';
export declare type pipelineType = (TransformStream | ReadableStream | WritableStream)[];
export declare type boundType = (ReadableStream)[];
export declare class DataPipeline {
    id: string;
    pipeline: pipelineType;
    bound: boundType;
    source: ReadableStream<any> | null;
    sink: WritableStream<any> | null;
    output?: DataStreamTrackGenerator | MediaStreamTrackGenerator<any>;
    kind: string;
    thread: boolean;
    worker?: Worker;
    constructor({ thread }?: {
        thread: boolean;
    });
    setSource: (track: DataStreamTrack | MediaStreamTrack) => void;
    setSink: (kind?: string) => void;
    add: (settings: any) => void;
}
