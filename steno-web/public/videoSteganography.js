// Video Steganography using Canvas API and HTML5 Video

class VideoSteganography {
    /**
     * Convert string to binary (8 bits per character)
     */
    static stringToBinary(str) {
        let binary = '';
        for (let i = 0; i < str.length; i++) {
            const bin = str.charCodeAt(i).toString(2).padStart(8, '0');
            binary += bin;
        }
        return binary;
    }

    /**
     * Convert binary to string
     */
    static binaryToString(binary) {
        let str = '';
        for (let i = 0; i < binary.length; i += 8) {
            const byte = binary.slice(i, i + 8);
            if (byte.length === 8) {
                const charCode = parseInt(byte, 2);
                if (charCode > 0 && charCode <= 127) { // Valid ASCII
                    str += String.fromCharCode(charCode);
                }
            }
        }
        return str;
    }

    /**
     * Encode a message into a video frame
     */
    static async encodeFrame(frame, binaryMessage, startBitIndex) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        canvas.width = frame.width;
        canvas.height = frame.height;

        // Draw frame
        ctx.drawImage(frame, 0, 0);

        // Get pixel data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Calculate how many bits we can store in this frame
        const bitsPerFrame = (data.length / 4) * 3; // RGB channels only
        const remainingBits = binaryMessage.length - startBitIndex;
        const bitsToEncode = Math.min(bitsPerFrame, remainingBits);

        // Encode message bits into LSB of RGB pixels
        let bitIndex = 0;
        for (let i = 0; i < data.length && bitIndex < bitsToEncode; i += 4) {
            // R, G, B channels (skip Alpha at i+3)
            for (let j = 0; j < 3 && bitIndex < bitsToEncode; j++) {
                const bit = parseInt(binaryMessage[startBitIndex + bitIndex]);
                // Clear LSB and set new bit
                data[i + j] = (data[i + j] & 0xFE) | bit;
                bitIndex++;
            }
        }

        // Put modified data back
        ctx.putImageData(imageData, 0, 0);
        
        return {
            canvas,
            bitsEncoded: bitIndex
        };
    }

    /**
     * Encode a message into a video
     */
    static async encodeMessage(videoFile, message) {
        return new Promise(async (resolve, reject) => {
            try {
                console.log('Starting video encoding process...');
                console.log('Video file:', videoFile.name, videoFile.type, videoFile.size, 'bytes');

                // Create video element
                const video = document.createElement('video');
                video.src = URL.createObjectURL(videoFile);
                
                // Enable error handling for video
                video.onerror = (e) => {
                    console.error('Video error:', video.error);
                    reject(new Error('Failed to load video: ' + (video.error?.message || 'Unknown error')));
                };

                // Wait for video to load
                await new Promise((resolve, reject) => {
                    video.onloadedmetadata = () => {
                        console.log('Video metadata loaded:', {
                            duration: video.duration,
                            width: video.videoWidth,
                            height: video.videoHeight
                        });
                        resolve();
                    };
                    video.onerror = () => reject(new Error('Failed to load video metadata'));
                    video.load();
                });

                // Prepare message with delimiter and convert to binary
                const delimiter = '###END###';
                const fullMessage = message + delimiter;
                const binaryMessage = this.stringToBinary(fullMessage);

                console.log('Message prepared:', {
                    messageLength: message.length,
                    fullLength: fullMessage.length,
                    binaryLength: binaryMessage.length
                });

                // Declare recorder in higher scope to access in callbacks
                let recorder;

                try {
                    // Check if MediaRecorder is supported
                    if (!window.MediaRecorder) {
                        throw new Error('MediaRecorder is not supported in this browser');
                    }

                    // Create output canvas with same dimensions
                    const outputCanvas = document.createElement('canvas');
                    outputCanvas.width = video.videoWidth;
                    outputCanvas.height = video.videoHeight;
                    
                    // Create MediaRecorder to capture modified frames
                    const outputStream = outputCanvas.captureStream(30); // 30 fps
                    console.log('Setting up MediaRecorder...');
                    
                    const mimeTypes = [
                        'video/webm;codecs=vp9',
                        'video/webm;codecs=vp8',
                        'video/webm'
                    ];
                    
                    let selectedMimeType = null;
                    for (const mimeType of mimeTypes) {
                        if (MediaRecorder.isTypeSupported(mimeType)) {
                            selectedMimeType = mimeType;
                            console.log('Using MIME type:', mimeType);
                            break;
                        }
                    }
                    
                    if (!selectedMimeType) {
                        throw new Error('No supported video MIME types found');
                    }

                    recorder = new MediaRecorder(outputStream, {
                        mimeType: selectedMimeType,
                        videoBitsPerSecond: 2500000 // 2.5 Mbps
                    });

                    const chunks = [];
                    recorder.ondataavailable = e => {
                        console.log('Received data chunk:', e.data.size, 'bytes');
                        if (e.data && e.data.size > 0) {
                            chunks.push(e.data);
                        }
                    };
                    
                    recorder.onerror = (event) => {
                        console.error('MediaRecorder error:', event);
                        reject(new Error('Failed to record video: ' + (event.error?.message || 'Unknown error')));
                    };
                    
                    recorder.onstop = () => {
                        console.log('Recording stopped, creating final video...');
                        if (chunks.length === 0) {
                            reject(new Error('No video data was recorded'));
                            return;
                        }
                        const blob = new Blob(chunks, { type: 'video/webm' });
                        console.log('Created video blob:', blob.size, 'bytes');
                        
                        // Verify the blob is valid
                        if (blob.size === 0) {
                            reject(new Error('Created video file is empty'));
                            return;
                        }
                        
                        resolve(blob);
                    };
                } catch (error) {
                    console.error('Failed to setup video recording:', error);
                    reject(new Error('Failed to setup video recording: ' + error.message));
                }

                // Setup progress tracking
                const totalFrames = Math.ceil(video.duration * 30); // 30fps
                let processedFrames = 0;

                // Start recording with timeslice to get data periodically
                recorder.start(1000); // Get data every second

                // Process frame by frame
                let startBitIndex = 0;
                const processFrame = async () => {
                    try {
                        if (startBitIndex >= binaryMessage.length) {
                            console.log('Encoding complete, stopping recorder');
                            recorder.stop();
                            return;
                        }

                        // Make sure video is not ended
                        if (video.ended || video.currentTime >= video.duration) {
                            console.log('Video ended before encoding was complete');
                            recorder.stop();
                            return;
                        }

                        const { canvas, bitsEncoded } = await this.encodeFrame(video, binaryMessage, startBitIndex);
                        
                        // Update canvas in output stream
                        const ctx = outputCanvas.getContext('2d');
                        ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
                        ctx.drawImage(canvas, 0, 0);
                        
                        startBitIndex += bitsEncoded;
                        processedFrames++;

                        // Update progress
                        const progress = Math.min((processedFrames / totalFrames) * 100, 100);
                        console.log(`Encoding progress: ${Math.round(progress)}% (Frame ${processedFrames}/${totalFrames})`);
                        document.getElementById('video-encrypt-result').innerHTML = 
                            `⏳ Encoding video: ${Math.round(progress)}%<br>Frame: ${processedFrames}/${totalFrames}`;

                        // Move to next frame
                        video.currentTime += 1/30; // Process at 30fps
                    } catch (error) {
                        console.error('Error processing frame:', error);
                        reject(new Error('Failed to process video frame: ' + error.message));
                    }
                };

                video.onseeked = processFrame;
                video.currentTime = 0;

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Decode a message from a video frame
     */
    static async decodeFrame(frame) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        canvas.width = frame.width;
        canvas.height = frame.height;

        // Draw frame
        ctx.drawImage(frame, 0, 0);

        // Get pixel data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Extract bits from LSB
        let binaryMessage = '';
        let currentByte = '';
        let extractedText = '';

        for (let i = 0; i < data.length; i += 4) {
            // R, G, B channels (skip Alpha at i+3)
            for (let j = 0; j < 3; j++) {
                const bit = data[i + j] & 1;
                currentByte += bit;
                binaryMessage += bit;

                // Process complete bytes
                if (currentByte.length === 8) {
                    const charCode = parseInt(currentByte, 2);
                    if (charCode > 0 && charCode <= 127) { // Valid ASCII
                        const char = String.fromCharCode(charCode);
                        extractedText += char;

                        // Check for delimiter
                        if (extractedText.includes('###END###')) {
                            return {
                                found: true,
                                message: extractedText.split('###END###')[0]
                            };
                        }
                    }
                    currentByte = '';
                }
            }
        }

        return {
            found: false,
            binaryMessage
        };
    }

    /**
     * Decode a message from a video
     */
    static async decodeMessage(videoFile) {
        return new Promise(async (resolve, reject) => {
            try {
                // Create video element
                const video = document.createElement('video');
                video.src = URL.createObjectURL(videoFile);
                await video.load();

                // Wait for metadata
                await new Promise(resolve => {
                    video.addEventListener('loadedmetadata', resolve);
                });

                console.log('Decoding video:', {
                    duration: video.duration,
                    width: video.videoWidth,
                    height: video.videoHeight
                });

                // Process frame by frame
                const processFrame = async () => {
                    const result = await this.decodeFrame(video);
                    
                    if (result.found) {
                        resolve(result.message);
                        return;
                    }

                    // Move to next frame
                    if (video.currentTime < video.duration) {
                        video.currentTime += 1/30; // Process at 30fps
                    } else {
                        reject(new Error('No hidden message found in video'));
                    }
                };

                video.onseeked = processFrame;
                video.currentTime = 0;

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Download blob as file
     */
    static downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

window.VideoSteganography = VideoSteganography;