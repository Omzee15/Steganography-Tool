// App.js - Main application logic
document.addEventListener('DOMContentLoaded', () => {
    // Navigation function for sidebar
    window.showSection = (sectionName) => {
        // Update nav items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));
        event.target.classList.add('active');

        // Update content sections
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => section.classList.remove('active'));
        document.getElementById(`${sectionName}-section`).classList.add('active');
    };

    // Legacy tab switching for backwards compatibility
    window.switchTab = (tabName) => {
        showSection(tabName);
    };

    // Character counter for text areas
    function setupCharCounter(textareaId, counterId) {
        const textarea = document.getElementById(textareaId);
        const counter = document.getElementById(counterId);

        textarea.addEventListener('input', () => {
            counter.textContent = textarea.value.length;
        });
    }

    setupCharCounter('message-text', 'char-count');
    setupCharCounter('video-message-text', 'video-char-count');

    // Image preview and capacity calculation
    document.getElementById('encrypt-image').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    // Show preview
                    const preview = document.getElementById('encrypt-image-preview');
                    preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                    preview.classList.add('show');

                    // Calculate capacity
                    const pixelCount = img.width * img.height;
                    const bitsCapacity = pixelCount * 3; // 3 bits per pixel (RGB)
                    const bytesCapacity = Math.floor(bitsCapacity / 8);
                    const charsCapacity = Math.floor(bytesCapacity - "###END###".length);

                    // Get current message length
                    const messageText = document.getElementById('message-text');
                    const currentLength = messageText.value.length;
                    const usagePercent = ((currentLength / charsCapacity) * 100).toFixed(1);
                    
                    // Update capacity display
                    document.querySelector('.capacity-status').innerHTML = `
                        Storage: <span style="color: ${currentLength > charsCapacity ? '#ff4444' : '#1961ccff'}">
                            ${currentLength.toLocaleString()} / ${charsCapacity.toLocaleString()} characters (${usagePercent}%)
                        </span>
                    `;

                    // Add input listener to update capacity usage in real-time
                    messageText.addEventListener('input', function() {
                        const len = this.value.length;
                        const percent = ((len / charsCapacity) * 100).toFixed(1);
                        document.querySelector('.capacity-status span').innerHTML = 
                            `${len.toLocaleString()} / ${charsCapacity.toLocaleString()} characters (${percent}%)`;
                        document.querySelector('.capacity-status span').style.color = 
                            len > charsCapacity ? '#ff4444' : '#2c5aa0';
                    });
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Image preview for decrypt
    document.getElementById('decrypt-image').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('decrypt-image-preview');
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                preview.classList.add('show');
            };
            reader.readAsDataURL(file);
        }
    });

    // Encrypt form
    document.getElementById('encrypt-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const imageFile = document.getElementById('encrypt-image').files[0];
        const message = document.getElementById('message-text').value;
        const result = document.getElementById('encrypt-result');
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.btn-text');
        const loader = submitBtn.querySelector('.loader');

        if (!imageFile || !message) {
            showResult('encrypt', 'Please provide both an image and a message', 'error');
            return;
        }

        try {
            btnText.style.display = 'none';
            loader.style.display = 'inline-block';
            submitBtn.disabled = true;

            const encryptedBlob = await Steganography.encodeMessage(imageFile, message);
            Steganography.downloadBlob(encryptedBlob, 'encrypted.png');
            
            showResult('encrypt', '✅ Message hidden successfully! Your image has been downloaded.', 'success');
        } catch (error) {
            showResult('encrypt', `Error: ${error.message}`, 'error');
        } finally {
            btnText.style.display = 'inline';
            loader.style.display = 'none';
            submitBtn.disabled = false;
        }
    });

    // Decrypt form
    document.getElementById('image-decrypt-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const imageFile = document.getElementById('decrypt-image').files[0];
        const selectedMethod = document.querySelector('input[name="extraction-method"]:checked').value;
        const result = document.getElementById('decrypt-result');
        const messageDisplay = document.getElementById('message-display');
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.btn-text');
        const loader = submitBtn.querySelector('.loader');

        if (!imageFile) {
            showResult('decrypt', 'Please provide an image', 'error');
            return;
        }

        try {
            btnText.style.display = 'none';
            loader.style.display = 'inline-block';
            submitBtn.disabled = true;
            messageDisplay.style.display = 'none';

            // Use the new universal decoder
            const extractionResult = await Steganography.decodeUniversal(imageFile, selectedMethod);
            
            // Update the UI with extraction results
            document.getElementById('used-method').textContent = selectedMethod.replace('-', ' ').toUpperCase();
            document.getElementById('confidence-score').textContent = extractionResult.confidence.toFixed(1) + '%';
            document.getElementById('chars-found').textContent = extractionResult.extractedData.length;
            
            // Display the message
            document.getElementById('decrypted-message').textContent = extractionResult.extractedData || 'No readable text found';
            messageDisplay.style.display = 'block';
            messageDisplay.dataset.message = extractionResult.extractedData;
            
            if (extractionResult.extractedData && extractionResult.extractedData.trim().length > 0) {
                if (extractionResult.confidence > 70) {
                    showResult('decrypt', '✅ Hidden message extracted successfully!', 'success');
                } else if (extractionResult.confidence > 30) {
                    showResult('decrypt', '⚠️ Data extracted with medium confidence. Try different methods if needed.', 'success');
                } else {
                    showResult('decrypt', '⚠️ Low confidence extraction. Data may be corrupted or use different encoding.', 'success');
                }
            } else {
                showResult('decrypt', '❓ No hidden text detected with this method. Try other extraction options.', 'error');
            }
        } catch (error) {
            showResult('decrypt', `Error: ${error.message}`, 'error');
        } finally {
            btnText.style.display = 'inline';
            loader.style.display = 'none';
            submitBtn.disabled = false;
        }
    });

    // Download text button
    document.getElementById('download-text-btn').addEventListener('click', function() {
        const message = document.getElementById('message-display').dataset.message;
        if (message) {
            Steganography.downloadText(message, 'decrypted-message.txt');
        }
    });

    // Video form handlers
    
    // Video preview for encrypt
    document.getElementById('encrypt-video').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('encrypt-video-preview');
                const video = preview.querySelector('video');
                video.src = e.target.result;
                video.style.display = 'block';
                preview.classList.add('show');

                // Calculate video capacity (rough estimate)
                video.addEventListener('loadedmetadata', function() {
                    const fps = 30; // Assume 30fps
                    const frames = Math.floor(video.duration * fps);
                    const pixelsPerFrame = video.videoWidth * video.videoHeight;
                    const bitsPerFrame = pixelsPerFrame * 3; // RGB channels
                    const totalBits = frames * bitsPerFrame;
                    const totalBytes = Math.floor(totalBits / 8);
                    const capacity = Math.floor(totalBytes - 9); // Minus delimiter length

                    document.getElementById('video-capacity').innerHTML = 
                        `<span style="color: #2c5aa0">${capacity.toLocaleString()} characters available</span>`;
                });
            };
            reader.readAsDataURL(file);
        }
    });

    // Video preview for decrypt
    document.getElementById('decrypt-video').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('decrypt-video-preview');
                const video = preview.querySelector('video');
                video.src = e.target.result;
                video.style.display = 'block';
                preview.classList.add('show');
            };
            reader.readAsDataURL(file);
        }
    });

    // Video encrypt form
    document.getElementById('video-encrypt-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const videoFile = document.getElementById('encrypt-video').files[0];
        const message = document.getElementById('video-message-text').value;
        const result = document.getElementById('video-encrypt-result');
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.btn-text');
        const loader = submitBtn.querySelector('.loader');

        if (!videoFile || !message) {
            showVideoResult('video-encrypt', 'Please provide both a video and a message', 'error');
            return;
        }

        try {
            btnText.style.display = 'none';
            loader.style.display = 'inline-block';
            submitBtn.disabled = true;

            const encryptedBlob = await VideoSteganography.encodeMessage(videoFile, message);
            VideoSteganography.downloadBlob(encryptedBlob, 'encrypted-video.webm');
            
            showVideoResult('video-encrypt', '✅ Message hidden successfully! Your video has been downloaded.', 'success');
        } catch (error) {
            showVideoResult('video-encrypt', `Error: ${error.message}`, 'error');
        } finally {
            btnText.style.display = 'inline';
            loader.style.display = 'none';
            submitBtn.disabled = false;
        }
    });

    // Video decrypt form
    document.getElementById('video-decrypt-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const videoFile = document.getElementById('decrypt-video').files[0];
        const result = document.getElementById('video-decrypt-result');
        const messageDisplay = document.getElementById('video-message-display');
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.btn-text');
        const loader = submitBtn.querySelector('.loader');

        if (!videoFile) {
            showVideoResult('video-decrypt', 'Please provide a video file', 'error');
            return;
        }

        try {
            btnText.style.display = 'none';
            loader.style.display = 'inline-block';
            submitBtn.disabled = true;
            messageDisplay.style.display = 'none';

            const message = await VideoSteganography.decodeMessage(videoFile);
            
            document.getElementById('video-decrypted-message').textContent = message;
            messageDisplay.style.display = 'block';
            messageDisplay.dataset.message = message;
            
            showVideoResult('video-decrypt', '✅ Message extracted successfully!', 'success');
        } catch (error) {
            showVideoResult('video-decrypt', `Error: ${error.message}`, 'error');
        } finally {
            btnText.style.display = 'inline';
            loader.style.display = 'none';
            submitBtn.disabled = false;
        }
    });

    // Video download text button
    document.getElementById('video-download-text-btn').addEventListener('click', function() {
        const message = document.getElementById('video-message-display').dataset.message;
        if (message) {
            Steganography.downloadText(message, 'decrypted-video-message.txt');
        }
    });

    // Show video result message
    function showVideoResult(section, message, type) {
        const resultDiv = document.getElementById(`${section}-result`);
        resultDiv.textContent = message;
        resultDiv.className = `result ${type}`;
        resultDiv.style.display = 'block';

        if (type === 'success') {
            setTimeout(() => {
                resultDiv.style.display = 'none';
            }, 5000);
        }
    }

    // Show result message
    function showResult(section, message, type) {
        const resultDiv = document.getElementById(`${section}-result`);
        resultDiv.textContent = message;
        resultDiv.className = `result ${type}`;
        resultDiv.style.display = 'block';

        if (type === 'success') {
            setTimeout(() => {
                resultDiv.style.display = 'none';
            }, 5000);
        }
    }
});