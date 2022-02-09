import { pipelineType, boundType } from './DataPipeline';
export declare let addSource: (source: ReadableStream, bound: boundType) => number;
export declare let addSink: (sink: WritableStream, bound: boundType) => Promise<void>;
export declare let addTransform: (o: TransformStream, pipeline: pipelineType, bound: boundType) => void;
export default self;
