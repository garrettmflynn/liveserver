/*
 *  Copyright (c) 2020 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
'use strict';
import { __awaiter, __generator } from "tslib";
var VideoSwirl = /** @class */ (function () {
    function VideoSwirl() {
        this.canvas_ = null;
        this.gl_ = null;
        this.sampler_ = null;
        this.program_ = null;
        this.texture_ = null;
        this.use_image_bitmap_ = false;
        this.debugPath_ = 'debug.pipeline.frameTransform_';
    }
    VideoSwirl.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            var gl, vertexShader, fragmentShader, programObject, linked, infoLog, vertices, txtcoords, pixel;
            return __generator(this, function (_a) {
                this.canvas_ = new OffscreenCanvas(1, 1);
                gl = (this.canvas_.getContext('webgl'));
                if (!gl) {
                    alert('Failed to create WebGL context. Check that WebGL is supported ' +
                        'by your browser and hardware.');
                    return [2 /*return*/];
                }
                this.gl_ = gl;
                vertexShader = this.loadShader_(gl.VERTEX_SHADER, "\n      precision mediump float;\n      attribute vec3 g_Position;\n      attribute vec2 g_TexCoord;\n      varying vec2 texCoord;\n      void main() {\n        gl_Position = vec4(g_Position, 1.0);\n        texCoord = g_TexCoord;\n      }");
                fragmentShader = this.loadShader_(gl.FRAGMENT_SHADER, "\n      precision mediump float;\n      varying vec2 texCoord;\n      uniform sampler2D inSampler;\n      void main(void) {\n        float boundary = distance(texCoord, vec2(0.5)) - 0.2;\n        if (boundary < 0.0) {\n          gl_FragColor = texture2D(inSampler, texCoord);\n        } else {\n          // Rotate the position\n          float angle = 2.0 * boundary;\n          vec2 rotation = vec2(sin(angle), cos(angle));\n          vec2 fromCenter = texCoord - vec2(0.5);\n          vec2 rotatedPosition = vec2(\n            fromCenter.x * rotation.y + fromCenter.y * rotation.x,\n            fromCenter.y * rotation.y - fromCenter.x * rotation.x) + vec2(0.5);\n          gl_FragColor = texture2D(inSampler, rotatedPosition);\n        }\n      }");
                if (!vertexShader || !fragmentShader)
                    return [2 /*return*/];
                programObject = gl.createProgram();
                gl.attachShader(programObject, vertexShader);
                gl.attachShader(programObject, fragmentShader);
                // Link the program
                gl.linkProgram(programObject);
                linked = gl.getProgramParameter(programObject, gl.LINK_STATUS);
                if (!linked) {
                    infoLog = gl.getProgramInfoLog(programObject);
                    gl.deleteProgram(programObject);
                    throw new Error("Error linking program:\n".concat(infoLog));
                }
                gl.deleteShader(vertexShader);
                gl.deleteShader(fragmentShader);
                this.sampler_ = gl.getUniformLocation(programObject, 'inSampler');
                this.program_ = programObject;
                vertices = [1.0, -1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0];
                txtcoords = [1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0];
                // Mirror horizonally.
                // const txtcoords = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0];
                this.attributeSetFloats_('g_Position', 2, vertices);
                this.attributeSetFloats_('g_TexCoord', 2, txtcoords);
                // Initialize input texture
                this.texture_ = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, this.texture_);
                pixel = new Uint8Array([0, 0, 255, 255]);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                return [2 /*return*/];
            });
        });
    };
    VideoSwirl.prototype.loadShader_ = function (type, shaderSrc) {
        var gl = this.gl_;
        var shader = gl.createShader(type);
        // Load the shader source
        gl.shaderSource(shader, shaderSrc);
        // Compile the shader
        gl.compileShader(shader);
        // Check the compile status
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            var infoLog = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error("Error compiling shader:\n".concat(infoLog));
        }
        return shader;
    };
    VideoSwirl.prototype.attributeSetFloats_ = function (attrName, vsize, arr) {
        var gl = this.gl_;
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.STATIC_DRAW);
        var attr = gl.getAttribLocation(this.program_, attrName);
        gl.enableVertexAttribArray(attr);
        gl.vertexAttribPointer(attr, vsize, gl.FLOAT, false, 0, 0);
    };
    VideoSwirl.prototype.transform = function (frame, controller) {
        return __awaiter(this, void 0, void 0, function () {
            var gl, width, height, timestamp, inputBitmap, outputBitmap, outputFrame;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        gl = this.gl_;
                        if (!gl || !this.canvas_) {
                            frame.close();
                            return [2 /*return*/];
                        }
                        width = frame.displayWidth;
                        height = frame.displayHeight;
                        if (this.canvas_.width !== width || this.canvas_.height !== height) {
                            this.canvas_.width = width;
                            this.canvas_.height = height;
                            gl.viewport(0, 0, width, height);
                        }
                        timestamp = frame.timestamp;
                        gl.activeTexture(gl.TEXTURE0);
                        gl.bindTexture(gl.TEXTURE_2D, this.texture_);
                        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                        if (!this.use_image_bitmap_) {
                            try {
                                // Supported for Chrome 90+.
                                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, frame);
                            }
                            catch (e) {
                                // This should only happen on Chrome <90.
                                // console.log(
                                //     '[WebGLTransform] Failed to upload VideoFrame directly. Falling ' +
                                //         'back to ImageBitmap.',
                                //     e);
                                this.use_image_bitmap_ = true;
                            }
                        }
                        if (!this.use_image_bitmap_) return [3 /*break*/, 2];
                        return [4 /*yield*/, frame.createImageBitmap({ imageOrientation: 'flipY' })];
                    case 1:
                        inputBitmap = _a.sent();
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, inputBitmap);
                        inputBitmap.close();
                        _a.label = 2;
                    case 2:
                        frame.close();
                        gl.useProgram(this.program_);
                        gl.uniform1i(this.sampler_, 0);
                        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
                        gl.bindTexture(gl.TEXTURE_2D, null);
                        if (!this.use_image_bitmap_) {
                            try {
                                // alpha: 'discard' is needed in order to send frames to a PeerConnection.
                                controller.enqueue(new VideoFrame(this.canvas_, { timestamp: timestamp, alpha: 'discard' }));
                            }
                            catch (e) {
                                // This should only happen on Chrome <91.
                                // console.log(
                                //     '[WebGLTransform] Failed to create VideoFrame from ' +
                                //         'OffscreenCanvas directly. Falling back to ImageBitmap.',
                                //     e);
                                this.use_image_bitmap_ = true;
                            }
                        }
                        if (!this.use_image_bitmap_) return [3 /*break*/, 4];
                        return [4 /*yield*/, createImageBitmap(this.canvas_)];
                    case 3:
                        outputBitmap = _a.sent();
                        outputFrame = new VideoFrame(outputBitmap, { timestamp: timestamp });
                        outputBitmap.close();
                        controller.enqueue(outputFrame);
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    VideoSwirl.prototype.destroy = function () {
        if (this.gl_) {
            // console.log('[WebGLTransform] Forcing WebGL context to be lost.');
            /** @type {!WEBGL_lose_context} */ (this.gl_.getExtension('WEBGL_lose_context'))
                .loseContext();
        }
    };
    return VideoSwirl;
}());
export { VideoSwirl };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViZ2wudHJhbnNmb3Jtcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3RyYW5zZm9ybXMvdmlkZW8vd2ViZ2wudHJhbnNmb3Jtcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxZQUFZLENBQUM7O0FBRWI7SUFDRTtRQUNFLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ3BCLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDO1FBQ2hCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxLQUFLLENBQUM7UUFDL0IsSUFBSSxDQUFDLFVBQVUsR0FBRyxnQ0FBZ0MsQ0FBQztJQUNyRCxDQUFDO0lBRUsseUJBQUksR0FBVjs7OztnQkFDRSxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksZUFBZSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDbkMsRUFBRSxHQUFHLENBQ1QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztnQkFDcEMsSUFBSSxDQUFDLEVBQUUsRUFBRTtvQkFDUCxLQUFLLENBQ0QsZ0VBQWdFO3dCQUNoRSwrQkFBK0IsQ0FBQyxDQUFDO29CQUNyQyxzQkFBTztpQkFDUjtnQkFDRCxJQUFJLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQztnQkFDUixZQUFZLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsYUFBYSxFQUFFLGdQQVFwRCxDQUFDLENBQUM7Z0JBQ0EsY0FBYyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLGVBQWUsRUFBRSxndkJBa0J4RCxDQUFDLENBQUM7Z0JBQ04sSUFBSSxDQUFD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