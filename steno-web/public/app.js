// Tab switching
function switchTab(tabName) {
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    document.getElementById(`${tabName}-section`).classList.add('active');

    // Clear results
    document.getElementById('encrypt-result').style.display = 'none';
    document.getElementById('decrypt-result').style.display = 'none';
    document.getElementById('message-display').style.display = 'none';
}

// Character counter
const messageTextarea = document.getElementById('message-text');
const charCount = document.getElementById('char-count');

messageTextarea.addEventListener('input', () => {
    charCount.textContent = messageTextarea.value.length;
});

// Image preview for encrypt
const encryptImageInput = document.getElementById('encrypt-image');
const encryptImagePreview = document.getElementById('encrypt-image-preview');

encryptImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            encryptImagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            encryptImagePreview.classList.add('show');
        };
        reader.readAsDataURL(file);
    }
});

// Image preview for decrypt
const decryptImageInput = document.getElementById('decrypt-image');
const decryptImagePreview = document.getElementById('decrypt-image-preview');

decryptImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            decryptImagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            decryptImagePreview.classList.add('show');
        };
        reader.readAsDataURL(file);
    }
});

// Encrypt form
const encryptForm = document.getElementById('encrypt-form');
encryptForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const imageFile = encryptImageInput.files[0];
    const message = messageTextarea.value;

    if (!imageFile || !message) {
        showResult('encrypt', 'Please upload an image and enter a message', 'error');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const loader = submitBtn.querySelector('.loader');
    
    btnText.style.display = 'none';
    loader.style.display = 'inline-block';
    submitBtn.disabled = true;

    try {
        const encryptedBlob = await Steganography.encodeMessage(imageFile, message);
        Steganography.downloadBlob(encryptedBlob, 'encrypted-image.png');
        
        showResult('encrypt', '✓ Message encrypted successfully! Your image has been downloaded.', 'success');
        encryptForm.reset();
        encryptImagePreview.classList.remove('show');
        charCount.textContent = '0';

    } catch (error) {
        showResult('encrypt', `Error: ${error.message}`, 'error');
    } finally {
        btnText.style.display = 'inline';
        loader.style.display = 'none';
        submitBtn.disabled = false;
    }
});

// Decrypt form
const decryptForm = document.getElementById('decrypt-form');
decryptForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const imageFile = decryptImageInput.files[0];

    if (!imageFile) {
        showResult('decrypt', 'Please upload an image', 'error');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const loader = submitBtn.querySelector('.loader');
    
    btnText.style.display = 'none';
    loader.style.display = 'inline-block';
    submitBtn.disabled = true;

    try {
        const message = await Steganography.decodeMessage(imageFile);
        
        showResult('decrypt', '✓ Message decrypted successfully!', 'success');
        
        const messageDisplay = document.getElementById('message-display');
        const decryptedMessage = document.getElementById('decrypted-message');
        decryptedMessage.textContent = message;
        messageDisplay.style.display = 'block';
        messageDisplay.dataset.message = message;

    } catch (error) {
        showResult('decrypt', `Error: ${error.message}`, 'error');
    } finally {
        btnText.style.display = 'inline';
        loader.style.display = 'none';
        submitBtn.disabled = false;
    }
});

// Download text button
document.getElementById('download-text-btn').addEventListener('click', () => {
    const message = document.getElementById('message-display').dataset.message;
    if (message) {
        Steganography.downloadText(message, 'decrypted-message.txt');
    }
});

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
