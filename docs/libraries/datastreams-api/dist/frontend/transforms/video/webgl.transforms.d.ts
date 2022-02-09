export class VideoSwirl {
    canvas_: any;
    gl_: any;
    sampler_: any;
    program_: any;
    texture_: any;
    use_image_bitmap_: boolean;
    debugPath_: string;
    init(): Promise<void>;
    loadShader_(type: any, shaderSrc: any): any;
    attributeSetFloats_(attrName: any, vsize: any, arr: any): void;
    transform(frame: any, controller: any): Promise<void>;
    destroy(): void;
}
