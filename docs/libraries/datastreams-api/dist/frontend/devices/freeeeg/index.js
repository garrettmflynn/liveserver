import { boyerMoore, bytesToInt16, bytesToInt24 } from "./utils";
// const mode = '512'; // Start byte value
var startByte = 160; // Start byte value
var stopByte = 192; // Stop byte value
var globalByteLength = 105; //expected length of 1 line of data
var adcLength = 99; //expected adc channel output length, the last 6 bytes are the accelerometer
var searchString = new Uint8Array([stopByte, startByte]); //Byte search string
// const readRate = 16.666667; //Throttle EEG read speed. (1.953ms/sample min @103 bytes/line)
// const readBufferSize = 2000; //Serial read buffer size, increase for slower read speeds (~1030bytes every 20ms) to keep up with the stream (or it will crash)
var updateMs, maxBufferedSamples;
var count = 0;
var ms = [];
var outputFilter;
export var oninit = function (device) {
    var mode = device.constraints.mode;
    device.constraints.samplingRate = 500;
    if (mode.includes("optical")) {
        device.constraints.baudRate = 921600;
    }
    if (mode.includes("ads131")) {
        device.constraints.samplingRate = 250;
    }
    if (mode.includes("freeeeg32_2")) {
        outputFilter = {
            4: "FP2",
            24: "FP1",
            8: "other",
        };
    }
    else if (mode.includes('freeeeg32_19')) {
        outputFilter = {
            4: "FP2",
            24: "FP1",
            0: "O2",
            1: "T6",
            2: "T4",
            3: "F8",
            5: "F4",
            6: "C4",
            7: "P4",
            25: "F3",
            26: "C3",
            27: "P3",
            28: "O1",
            29: "T5",
            30: "T3",
            31: "F7",
            16: "FZ",
            12: "PZ",
            8: "other"
        };
    }
    else {
        outputFilter = {
            4: "FP2",
            24: "FP1",
            8: "other",
        };
    }
    updateMs = 1000 / device.constraints.samplingRate; //even spacing
    device.constraints.bufferSize = maxBufferedSamples = device.constraints.samplingRate * 60 * 2;
};
export var ondata = function (buffer) {
    var needle = searchString;
    var haystack = buffer;
    var _a = boyerMoore(needle), search = _a.search, byteLength = _a.byteLength;
    var indices = [];
    // let newLines = 0;
    // Create New Data Object Every Time
    var data = {};
    for (var i = search(haystack); i !== -1; i = search(haystack, i + byteLength)) {
        indices.push(i);
    }
    //console.log(indices);
    if (indices.length >= 2) {
        for (var k = 1; k < indices.length; k++) {
            if (indices[k] - indices[k - 1] !== globalByteLength) {
            } //This is not a valid sequence going by size, drop sequence and return
            else {
                var line = buffer.slice(indices[k - 1], indices[k] + 1); //Splice out this line to be decoded
                // line[0] = stop byte, line[1] = start byte, line[2] = counter, line[3:99] = ADC data 32x3 bytes, line[100-104] = Accelerometer data 3x2 bytes
                //line found, decode.
                if (count < maxBufferedSamples) {
                    count++;
                }
                if (count - 1 === 0) {
                    ms[count - 1] = Date.now();
                }
                else {
                    ms[count - 1] = ms[count - 2] + updateMs;
                    if (count >= maxBufferedSamples) {
                        ms.splice(0, 5120);
                        // ms.push(new Array(5120).fill(0));
                    }
                } //Assume no dropped samples
                for (var i = 3; i < adcLength; i += 3) {
                    var num = (i - 3) / 3;
                    var decoded = bytesToInt24(line[i], line[i + 1], line[i + 2]);
                    if (outputFilter == null)
                        data["A" + num] = decoded;
                    else
                        data[outputFilter[num]] = decoded;
                }
                data["Ax"] = bytesToInt16(line[99], line[100]);
                data["Ay"] = bytesToInt16(line[101], line[102]);
                data["Az"] = bytesToInt16(line[103], line[104]);
            }
        }
    }
    return data;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9kZXZpY2VzL2ZyZWVlZWcvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsWUFBWSxFQUFFLE1BQU0sU0FBUyxDQUFBO0FBRWhFLDBDQUEwQztBQUMxQyxJQUFNLFNBQVMsR0FBRyxHQUFHLENBQUMsQ0FBQyxtQkFBbUI7QUFDMUMsSUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLENBQUMsa0JBQWtCO0FBQ3hDLElBQU0sZ0JBQWdCLEdBQUcsR0FBRyxDQUFDLENBQUMsbUNBQW1DO0FBQ2pFLElBQU0sU0FBUyxHQUFHLEVBQUUsQ0FBQyxDQUFDLDRFQUE0RTtBQUNsRyxJQUFNLFlBQVksR0FBRyxJQUFJLFVBQVUsQ0FBQyxDQUFDLFFBQVEsRUFBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsb0JBQW9CO0FBQy9FLDhGQUE4RjtBQUM5RixnS0FBZ0s7QUFFaEssSUFBSSxRQUFlLEVBQUUsa0JBQXlCLENBQUE7QUFFOUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFBO0FBQ2IsSUFBTSxFQUFFLEdBQWUsRUFBRSxDQUFBO0FBRXpCLElBQUksWUFBMkMsQ0FBQTtBQUcvQyxNQUFNLENBQUMsSUFBTSxNQUFNLEdBQUcsVUFBQyxNQUFtQjtJQUV0QyxJQUFNLElBQUksR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQTtJQUVwQyxNQUFNLENBQUMsV0FBVyxDQUFDLFlBQVksR0FBRyxHQUFHLENBQUM7SUFHdEMsSUFBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxFQUFFO1FBQ3pCLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQztLQUN4QztJQUVELElBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUN4QixNQUFNLENBQUMsV0FBVyxDQUFD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