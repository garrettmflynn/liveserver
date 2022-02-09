/**
 * The Transform class allows you to specify arbitrary transforms in the ontransform callback.
 * ```typescript
 * import { transforms } from "datastreams-api";
 *
 * const transform = new transforms.Transform();
 * transform.addEventListener('transform', (chunk, controller) => {
 *      let data = chunk.copy()
 *      chunk.close()
 *      controller.enqueue(chunk)
 * })
 * ```
 */
export declare class Transform extends EventTarget {
    constructor();
    start(): Promise<void>;
    transform(chunk: any, controller: TransformStreamDefaultController): Promise<void>;
    end(): Promise<void>;
    onstart: (e: Event) => any;
    ontransform: (e: CustomEvent) => any;
    onend: (e: Event) => any;
}
