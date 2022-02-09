/**
 * Transforms data on the GPU using GPU
 * Note: Currently broken from .ts refactor
 */
import { Pipe } from './Pipe';
import { PipeSettingsType } from '../types/Pipes.types';
export declare class GPUPipe extends Pipe {
    constructor(settings: PipeSettingsType);
}
