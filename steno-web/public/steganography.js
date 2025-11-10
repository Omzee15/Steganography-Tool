// Client-Side LSB Steganography using Canvas API

class Steganography {
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
                if (charCode > 0) { // Skip null characters
                    str += String.fromCharCode(charCode);
                }
            }
        }
        return str;
    }

    /**
     * Encode a message into an image
     */
    static async encodeMessage(imageFile, message) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d', { willReadFrequently: true });
                        canvas.width = img.width;
                        canvas.height = img.height;

                        // Draw image
                        ctx.drawImage(img, 0, 0);

                        // Get pixel data
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const data = imageData.data;

                        // Prepare message with delimiter
                        const delimiter = '###END###';
                        const fullMessage = message + delimiter;
                        const binaryMessage = this.stringToBinary(fullMessage);

                        console.log('Encoding message:', {
                            originalLength: message.length,
                            withDelimiter: fullMessage.length,
                            totalBits: binaryMessage.length,
                            maxBits: (data.length / 4) * 3,
                            maxChars: Math.floor((data.length / 4) * 3 / 8)
                        });

                        // Check if image can hold the message
                        const maxBits = (data.length / 4) * 3; // RGB channels only
                        if (binaryMessage.length > maxBits) {
                            reject(new Error(`Message too large! Image can hold ${Math.floor(maxBits / 8)} characters, but message is ${message.length} characters.`));
                            return;
                        }

                        // Encode message into LSB of RGB pixels
                        let bitIndex = 0;
                        for (let i = 0; i < data.length && bitIndex < binaryMessage.length; i += 4) {
                            // R, G, B channels (skip Alpha at i+3)
                            for (let j = 0; j < 3 && bitIndex < binaryMessage.length; j++) {
                                const bit = parseInt(binaryMessage[bitIndex]);
                                // Clear LSB and set new bit
                                data[i + j] = (data[i + j] & 0xFE) | bit;
                                bitIndex++;
                            }
                        }

                        console.log('Encoded', bitIndex, 'bits');

                        // Put modified data back
                        ctx.putImageData(imageData, 0, 0);

                        // Convert to PNG blob with maximum quality
                        canvas.toBlob((blob) => {
                            if (blob) {
                                console.log('Created blob:', blob.size, 'bytes');
                                resolve(blob);
                            } else {
                                reject(new Error('Failed to create image'));
                            }
                        }, 'image/png');

                    } catch (error) {
                        reject(error);
                    }
                };

                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(imageFile);
        });
    }

    /**
     * Decode a message from an image
     */
    static async decodeMessage(imageFile) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d', { willReadFrequently: true });
                        canvas.width = img.width;
                        canvas.height = img.height;

                        // Draw image
                        ctx.drawImage(img, 0, 0);

                        // Get pixel data
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const data = imageData.data;

                        console.log('Starting decoding from image:', {
                            width: canvas.width,
                            height: canvas.height,
                            totalPixels: data.length / 4,
                            maxCharacters: Math.floor((data.length / 4) * 3 / 8)
                        });

                        // Extract bits and build the message
                        let binaryMessage = '';
                        let currentByte = '';
                        let extractedText = '';
                        let maxBitsToCheck = Math.min((data.length / 4) * 3, 1000000); // Limit to prevent infinite loops
                        
                        // Extract LSB from each RGB channel
                        for (let i = 0; i < data.length && binaryMessage.length < maxBitsToCheck; i += 4) {
                            // Process R, G, B channels (skip Alpha)
                            for (let j = 0; j < 3 && binaryMessage.length < maxBitsToCheck; j++) {
                                const bit = data[i + j] & 1; // Get LSB
                                currentByte += bit;
                                binaryMessage += bit;

                                // Process complete bytes
                                if (currentByte.length === 8) {
                                    const charCode = parseInt(currentByte, 2);
                                    if (charCode >= 32 && charCode <= 126) { // Printable ASCII
                                        const char = String.fromCharCode(charCode);
                                        extractedText += char;
                                        
                                        // Log progress
                                        if (extractedText.length % 50 === 0) {
                                            console.log('Extracted so far:', extractedText.length, 'chars');
                                        }

                                        // Check for delimiter
                                        if (extractedText.includes('###END###')) {
                                            const message = extractedText.split('###END###')[0];
                                            console.log('Success! Found message:', message.slice(0, 50) + '...');
                                            resolve(message);
                                            return;
                                        }
                                    }
                                    currentByte = ''; // Reset for next byte
                                }
                            }
                        }

                        console.log('Decoding failed:', {
                            bitsExtracted: binaryMessage.length,
                            bytesProcessed: Math.floor(binaryMessage.length / 8),
                            textExtracted: extractedText.length,
                            sampleExtracted: extractedText.slice(0, 100)
                        });
                        
                        reject(new Error('Could not find a valid message. Make sure this image was encrypted using this tool.'));

                    } catch (error) {
                        console.error('Decoding error:', error);
                        reject(error);
                    }
                };

                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(imageFile);
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

    /**
     * Download text as file
     */
    static downloadText(text, filename) {
        const blob = new Blob([text], { type: 'text/plain' });
        this.downloadBlob(blob, filename);
    }
}

window.Steganography = Steganography;
