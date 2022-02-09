/**
 * Transforms data on the GPU using GPU
 * Note: Currently broken from .ts refactor
 */
import { __extends } from "tslib";
import { Pipe } from './Pipe';
var GPUPipe = /** @class */ (function (_super) {
    __extends(GPUPipe, _super);
    function GPUPipe(settings) {
        return _super.call(this, 'gpu', settings) || this;
    }
    return GPUPipe;
}(Pipe));
export { GPUPipe };
// import 'gpujsutils/gpu/gpu-browser.min'
// import { gpuUtils } from 'gpujsutils/gpuUtils'
// import { createGpuKernels as krnl } from 'gpujsutils/gpuUtils-functs';
// import { PipeSettingsType } from '../types/Pipes.types'
// import { DataStream } from '../core/index';
// /** 
//  * GPU Data Pipe for the DataStreams API
//  * Note: Currently only works for convolution on a video element
//  */
// export class GPUPipe extends Pipe{
//     get [Symbol.toStringTag]() { return 'GPU' }
//     // Create GPU Instance
//     // gpu: any = new GPU({mode: 'gpu'})
//     gpuUtils: gpuUtils = new gpuUtils() // new gpuUtils(this.gpu)
//     container?: HTMLElement | Node
//     width?: number
//     height?: number
//     canvas?: HTMLCanvasElement
//     loaded: boolean = false
//     constructor(settings:PipeSettingsType) {
//         super('gpu', settings)
//         // Replace Existing Video Visually
//         if (this.settings.element) {
//           this.container = this.settings.element.parentNode ?? document.createElement('div') // place canvas in the parent of the element
//           // this.settings.element.style.position = 'absolute'
//           // this.settings.element.style.visibility = 'hidden'
//           let k = this.gpuUtils.addCanvasKernel('convolveImage', krnl.ImgConv2DKern, this.container)
//           this.canvas = k.canvas
//           // Setting canvas position
//           this.width = this.settings.element.clientWidth
//           this.height = this.settings.element.clientHeight
//           let reducedElement = this.settings.element // this.canvas
//           reducedElement.style.position = 'absolute'
//           reducedElement.style.bottom = '0px'
//           reducedElement.style.right = '0px'
//           reducedElement.style.width = '100px'
//           reducedElement.style.height = '50px'
//           this.settings.element.addEventListener('loadeddata',()=>{ this.loaded = true})
//           // TODO: Can't stream yet. This breaks.
//           // let canvasStream = this.canvas.captureStream()
//           // this.settings.element.srcObject = canvasStream
//         } 
//         // Otherwise allow the user to declare custom functions
//         else {
//           // let k = this.gpuUtils.addKernel(this.settings.name, this.settings.function, this.container)
//         }
//     }
//     // Note: Must actually thread here
//     process = async (args: any | any[]) => {
//         if (!Array.isArray(args)) args = [args]
//         // console.log(args)
//         let data 
//         if (this.settings.element && Array.isArray(args[0])){
//           if (this.loaded){
//             // Ensure Proper Scaling
//             let dims = this.getDimensions()
//             let width = dims.width
//             let height = dims.height
//             this.settings.element.width = width ?? 0
//             this.settings.element.height = height ?? 0
//             // Run Video Convolution
//             let gpuArgs = [this.settings.element, width, height, args[0], args[0].length];
//             // console.log(gpuArgs)
//             data = this.gpuUtils.callCanvasKernel('convolveImage', gpuArgs, [width, height]) // set output width and height
//           }
//           this.ondata({data}) // pass to subscriptions
//         } else {
//           // data = this.gpuUtils.call(this.settings.name, args) // set output width and height
//           // console.log(data)
//           // this.ondata({data}) // pass to subscriptions
//         }
//         return data
//     }
//     // --------------------------------------- Video Helper Functions ---------------------------------------
//     getDimensions = () => {
//         let settings = (this.settings.element?.srcObject as DataStream)?.getVideoTracks()[0].getSettings()
//         let width = this.width // mirror video width
//         let height = this.height // mirror video height
//         let sourceWidth = settings.width ?? width
//         let sourceHeight = settings.height ?? height
//         return { width, height, sourceWidth, sourceHeight }
//       }
// }
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR1BVLnBpcGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9waXBlcy9HUFUucGlwZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0dBR0c7O0FBRUgsT0FBTyxFQUFDLElBQUksRUFBQyxNQUFNLFFBQVEsQ0FBQTtBQUczQjtJQUE2QiwyQkFBSTtJQUMvQixpQkFBWSxRQUF5QjtlQUNuQyxrQkFBTSxLQUFLLEVBQUUsUUFBUSxDQUFDO0lBQ3hCLENBQUM7SUFDSCxjQUFDO0FBQUQsQ0FBQyxBQUpELENBQTZCLElBQUksR0FJaEM7O0FBRUQsMENBQTBDO0FBQzFDLGlEQUFpRDtBQUNqRCx5RUFBeUU7QUFDekUsMERBQTBEO0FBQzFELDhDQUE4QztBQUU5QyxPQUFPO0FBQ1AsMkNBQTJDO0FBQzNDLG1FQUFtRTtBQUNuRSxNQUFNO0FBR04scUNBQXFDO0FBRXJDLGtEQUFrRDtBQUVsRCw2QkFBNkI7QUFDN0IsMkNBQTJDO0FBQzNDLG9FQUFvRTtBQUNwRSxxQ0FBcUM7QUFDckMscUJBQXFCO0FBQ3JCLHNCQUFzQjtBQUN0QixpQ0FBaUM7QUFDakMsOEJBQThCO0FBRTlCLCtDQUErQztBQUMvQyxpQ0FBaUM7QUFFakMsNkNBQTZDO0FBQzdDLHVDQUF1QztBQUN2Qyw0SUFBNEk7QUFDNUksaUVBQWlFO0FBQ2pFLGlFQUFpRTtBQUVqRSx1R0FBdUc7QUFDdkcsbUNBQW1DO0FBRW5DLHVDQUF1QztBQUN2QywyREFBMkQ7QUFDM0QsNkRBQTZEO0FBQzdELHNFQUFzRTtBQUN0RSx1REFBdUQ7QUFDdkQsZ0RBQWdEO0FBQ2hELCtDQUErQztBQUMvQyxpREFBaUQ7QUFDakQsaURBQWlEO0FBR2pELDJGQUEyRjtBQUUzRixvREFBb0Q7QUFDcEQsOERBQThEO0FBQzlELDhEQUE4RDtBQUM5RCxhQUFhO0FBRWIsa0VBQWtFO0FBQ2xFLGlCQUFpQjtBQUNqQiwyR0FBMkc7QUFDM0csWUFBWTtBQUNaLFFBQVE7QUFHUix5Q0FBeUM7QUFDekMsK0NBQStDO0FBQy9DLGtEQUFrRDtBQUNsRCwrQkFBK0I7QUFFL0Isb0JBQW9CO0FBQ3BCLGdFQUFnRTtBQUVoRSw4QkFBOEI7QUFDOUIsdUNBQXVDO0FBQ3ZDLDhDQUE4QztBQUM5QyxxQ0FBcUM7QUFDckMsdUNBQXVDO0FBQ3ZDLHVEQUF1RDtBQUN2RCx5REFBeUQ7QUFFekQsdUNBQXVDO0FBQ3ZDLDZGQUE2RjtBQUM3RixzQ0FBc0M7QUFDdEMsOEhBQThIO0FBQzlILGNBQWM7QUFFZCx5REFBeUQ7QUFFekQsbUJBQW1CO0FBQ25CLGtHQUFrRztBQUNsRyxpQ0FBaUM7QUFDakMsNERBQTREO0FBRTVELFlBQVk7QUFFWixzQkFBc0I7QUFDdEIsUUFBUTtBQUVSLGdIQUFnSDtBQUNoSCw4QkFBOEI7QUFDOUIsNkdBQTZHO0FBQzdHLHVEQUF1RDtBQUN2RCwwREFBMEQ7QUFDMUQsb0RBQW9EO0FBQ3BELHVEQUF1RDtBQUN2RCw4REFBOEQ7QUFDOUQsVUFBVTtBQUNWLElBQUkifQ==