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
     * Universal LSB decoder that works with any steganographic image
     */
    static async decodeUniversal(imageFile, method = 'lsb-basic') {
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

                        console.log('Universal decoding from image:', {
                            width: canvas.width,
                            height: canvas.height,
                            totalPixels: data.length / 4,
                            method: method
                        });

                        let result = '';

                        switch (method) {
                            case 'lsb-basic':
                                result = this.extractLSBBasic(data);
                                break;
                            case 'lsb-sequence':
                                result = this.extractLSBSequence(data);
                                break;
                            case 'red-channel-only':
                                result = this.extractRedChannelOnly(data);
                                break;
                            case 'pattern-detection':
                                result = this.extractWithPatternDetection(data);
                                break;
                            default:
                                result = this.extractLSBBasic(data);
                        }

                        resolve({
                            method: method,
                            extractedData: result.text,
                            rawBinary: result.binary,
                            confidence: result.confidence,
                            stats: result.stats
                        });

                    } catch (error) {
                        console.error('Universal decoding error:', error);
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
     * Basic LSB extraction from RGB channels
     */
    static extractLSBBasic(data) {
        let binaryMessage = '';
        let extractedText = '';
        let printableChars = 0;
        let totalChars = 0;
        let currentByte = '';
        let rawText = ''; // Keep raw text including all characters

        // Extract LSB from RGB channels
        for (let i = 0; i < data.length && totalChars < 5000; i += 4) { // Increased limit
            for (let j = 0; j < 3; j++) {
                const bit = data[i + j] & 1;
                currentByte += bit;
                binaryMessage += bit;

                if (currentByte.length === 8) {
                    const charCode = parseInt(currentByte, 2);
                    totalChars++;
                    
                    // Store the raw character first
                    const char = String.fromCharCode(charCode);
                    rawText += char;

                    // Check for delimiter in RAW text FIRST
                    if (rawText.includes('###END###')) {
                        extractedText = rawText.split('###END###')[0];
                        const delimiterIndex = rawText.indexOf('###END###');
                        // Recalculate printable chars for the actual message
                        printableChars = 0;
                        for (let k = 0; k < extractedText.length; k++) {
                            if (extractedText.charCodeAt(k) >= 32 && extractedText.charCodeAt(k) <= 126) {
                                printableChars++;
                            }
                        }
                        totalChars = extractedText.length;
                        break;
                    }
                    
                    if (charCode >= 32 && charCode <= 126) { // Printable ASCII
                        extractedText += char;
                        printableChars++;
                    } else if (charCode === 10 || charCode === 13) { // Newline, carriage return
                        extractedText += char;
                        printableChars++; // Count as valid
                    } else if (charCode === 0) {
                        // Null terminator - only stop if we haven't found content yet
                        if (extractedText.length < 5) {
                            extractedText += '�';
                        }
                    } else {
                        extractedText += '�'; // Non-printable placeholder
                    }

                    currentByte = '';

                    // More lenient auto-stop - only if we're getting mostly garbage after 100 chars
                    if (totalChars > 100 && (printableChars / totalChars) < 0.2) {
                        break;
                    }
                }
            }
            
            // Break outer loop if delimiter found
            if (rawText.includes('###END###')) {
                break;
            }
        }

        const confidence = totalChars > 0 ? (printableChars / totalChars) * 100 : 0;

        return {
            text: extractedText,
            binary: binaryMessage,
            confidence: confidence,
            stats: {
                totalChars,
                printableChars,
                confidencePercent: confidence.toFixed(1)
            }
        };
    }

    /**
     * Extract using sequence pattern (placeholder for future implementation)
     */
    static extractLSBSequence(data) {
        // For now, same as basic but with different pattern
        return this.extractLSBBasic(data);
    }

    /**
     * Extract from red channel only (placeholder for future implementation)
     */
    static extractRedChannelOnly(data) {
        let binaryMessage = '';
        let extractedText = '';
        let printableChars = 0;
        let totalChars = 0;
        let currentByte = '';

        // Extract LSB from red channel only
        for (let i = 0; i < data.length && totalChars < 2000; i += 4) {
            const bit = data[i] & 1; // Red channel only
            currentByte += bit;
            binaryMessage += bit;

            if (currentByte.length === 8) {
                const charCode = parseInt(currentByte, 2);
                totalChars++;
                
                if (charCode >= 32 && charCode <= 126) {
                    const char = String.fromCharCode(charCode);
                    extractedText += char;
                    printableChars++;
                } else {
                    extractedText += '�';
                }

                currentByte = '';

                if (totalChars > 50 && (printableChars / totalChars) < 0.3) {
                    break;
                }
            }
        }

        const confidence = totalChars > 0 ? (printableChars / totalChars) * 100 : 0;

        return {
            text: extractedText,
            binary: binaryMessage,
            confidence: confidence,
            stats: {
                totalChars,
                printableChars,
                confidencePercent: confidence.toFixed(1)
            }
        };
    }

    /**
     * Pattern detection method (placeholder for future implementation)
     */
    static extractWithPatternDetection(data) {
        // For now, same as basic
        return this.extractLSBBasic(data);
    }

    /**
     * Legacy decode method for backwards compatibility
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
                        let rawText = ''; // Keep raw text including all characters
                        let maxBitsToCheck = Math.min((data.length / 4) * 3, 10000000); // Limit to prevent infinite loops
                        
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
                                    const char = String.fromCharCode(charCode);
                                    rawText += char; // Store all characters
                                    
                                    // Check for delimiter in RAW text FIRST
                                    if (rawText.includes('###END###')) {
                                        const message = rawText.split('###END###')[0];
                                        console.log('Success! Found message:', message.slice(0, 50) + '...');
                                        resolve(message);
                                        return;
                                    }
                                    
                                    if (charCode >= 32 && charCode <= 126 || charCode === 10 || charCode === 13) { // Printable ASCII or newlines
                                        extractedText += char;
                                        
                                        // Log progress
                                        if (extractedText.length % 50 === 0) {
                                            console.log('Extracted so far:', extractedText.length, 'chars');
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
