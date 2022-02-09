import { Pipe } from "./Pipe";
import { PipeSettingsType } from '../types/Pipes.types';
export default class HardwarePipe extends Pipe {
    get [Symbol.toStringTag](): string;
    constructor(settings: PipeSettingsType);
    process: (args: any | any[]) => Promise<{} | null>;
    transform: (chunk: any, controller: TransformStreamDefaultController) => Promise<void>;
}
