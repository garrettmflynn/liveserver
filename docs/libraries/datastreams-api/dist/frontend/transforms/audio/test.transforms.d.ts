export declare class AudioTest {
    constructor();
    init(): Promise<void>;
    transform(audioData: any, controller: TransformStreamDefaultController): Promise<void>;
    deinit(): void;
}
