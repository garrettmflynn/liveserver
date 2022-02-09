// Constraints which are specified using any or all of max, min, or exact are always treated as mandatory. 
// If any constraint which uses one or more of those can't be met when calling applyConstraints(), the promise will be rejected.
var DataTrackConstraints = /** @class */ (function () {
    function DataTrackConstraints(track) {
        this.channelCount = undefined;
        this.latency = undefined;
        this.sampleRate = undefined;
        this.sampleSize = undefined;
        this.volume = undefined;
        // Image Tracks
        this.whiteBalanceMode = undefined;
        this.exposureMode = undefined;
        this.focusMode = undefined;
        this.pointOfInterest = undefined;
        this.exposureCompensation = undefined;
        this.colorTemperature = undefined;
        this.iso = undefined;
        this.brightness = undefined;
        this.contrast = undefined;
        this.saturation = undefined;
        this.sharpness = undefined;
        this.focusDistance = undefined;
        this.zoom = undefined;
        this.torch = undefined;
        // Video Tracks
        this.aspectRatio = undefined;
        this.frameRate = undefined;
        this.height = undefined;
        this.width = undefined;
        this.resizeMode = undefined;
        // Shared Screen Tracks
        this.cursor = ['always', 'motion', 'never']; // can be single string
        this.displaySurface = ['application', 'browser', 'monitor', 'window']; // can be single string
        this.logicalSurface = false;
        console.error('TODO: Get Constraints', track); // TODO: Get Constraints
        return this;
    }
    return DataTrackConstraints;
}());
export { DataTrackConstraints };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGF0YVRyYWNrQ29uc3RyYWludHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9jb3JlL0RhdGFUcmFja0NvbnN0cmFpbnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLDJHQUEyRztBQUMzRyxnSUFBZ0k7QUFFaEk7SUE0Q0ksOEJBQVksS0FBc0I7UUF0QzlCLGlCQUFZLEdBQXVCLFNBQVMsQ0FBQTtRQUU1QyxZQUFPLEdBQXVCLFNBQVMsQ0FBQTtRQUV2QyxlQUFVLEdBQXVCLFNBQVMsQ0FBQTtRQUMxQyxlQUFVLEdBQXVCLFNBQVMsQ0FBQTtRQUMxQyxXQUFNLEdBQXVCLFNBQVMsQ0FBQTtRQUV0QyxlQUFlO1FBQ2YscUJBQWdCLEdBQXVCLFNBQVMsQ0FBQTtRQUNoRCxpQkFBWSxHQUF1QixTQUFTLENBQUE7UUFDNUMsY0FBUyxHQUF1QixTQUFTLENBQUE7UUFDekMsb0JBQWUsR0FBdUIsU0FBUyxDQUFBO1FBQy9DLHlCQUFvQixHQUF1QixTQUFTLENBQUE7UUFDcEQscUJBQWdCLEdBQXVCLFNBQVMsQ0FBQTtRQUNoRCxRQUFHLEdBQXVCLFNBQVMsQ0FBQTtRQUNuQyxlQUFVLEdBQXVCLFNBQVMsQ0FBQTtRQUMxQyxhQUFRLEdBQXVCLFNBQVMsQ0FBQTtRQUN4QyxlQUFVLEdBQXVCLFNBQVMsQ0FBQTtRQUMxQyxjQUFTLEdBQXVCLFNBQVMsQ0FBQTtRQUN6QyxrQkFBYSxHQUF1QixTQUFTLENBQUE7UUFDN0MsU0FBSSxHQUF1QixTQUFTLENBQUE7UUFDcEMsVUFBSyxHQUF1QixTQUFTLENBQUE7UUFFckMsZUFBZTtRQUNmLGdCQUFXLEdBQXVCLFNBQVMsQ0FBQTtRQUUzQyxjQUFTLEdBQXVCLFNBQVMsQ0FBQTtRQUN6QyxXQUFNLEdBQXVCLFNBQVMsQ0FBQTtRQUN0QyxVQUFLLEdBQXVCLFNBQVMsQ0FBQTtRQUNyQyxlQUFVLEdBQXVCLFNBQVMsQ0FBQTtRQUUxQyx1QkFBdUI7UUFDdkIsV0FBTSxHQUFzQixDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUEsQ0FBQyx1QkFBdUI7UUFDakYsbUJBQWMsR0FBc0IsQ0FBQyxhQUFhLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQSxDQUFDLHVCQUF1QjtRQUMzRyxtQkFBYyxHQUFZLEtBQUssQ0FBQTtRQUkvQixPQUFPLENBQUMsS0FBSyxDQUFDLHVCQUF1QixFQUFFLEtBQUssQ0FBQyxDQUFBLENBQUMsd0JBQXdCO1FBQ3RFLE9BQU8sSUFBSSxDQUFBO0lBQ2YsQ0FBQztJQUNMLDJCQUFDO0FBQUQsQ0FBQyxBQWhERCxJQWdEQyJ9