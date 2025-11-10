# EchoDcrypt - LSB Steganography Tool 🔐

A modern web application for LSB (Least Significant Bit) steganography that works entirely in your browser. Hide and extract text messages in images and videos without any data leaving your device.

🌐 **Live Demo:** [http://echodcrypt.netlify.app](http://echodcrypt.netlify.app)

## What is LSB Steganography?

LSB steganography is a technique that hides information by modifying the least significant bit of each pixel value in an image. Since the LSB contributes minimally to the overall pixel value, changes are virtually invisible to the human eye.

## 📏 Capacity Limits

The maximum text length depends on media dimensions:
- **Images:** `(width × height × 3) ÷ 8 - 9` characters
- **Videos:** `frames × width × height × 3 ÷ 8 - 9` characters

One single 720p image can roughly store 345 kb of hidden information which is about 353,280 characters ≈ 70,000 words
## ✨ Features

- 🌐 **100% Client-Side** - No data uploaded to servers, complete privacy
- � **Image Steganography** - Hide text in PNG, JPEG, and other image formats
- 🎬 **Video Steganography** - Hide messages in video files (MP4, WebM)
- 📊 **Capacity Calculator** - See how much text your media can store
- 🔍 **Extract Messages** - Decode hidden text from images and videos
- 🎨 **Modern UI** - Clean, responsive interface with tabbed navigation
- 🚀 **Instant Results** - Real-time processing with no server delays
- 📱 **Mobile Friendly** - Works on desktop, tablet, and mobile devices

## 🚀 Quick Start

### Online Usage (Recommended)
Visit [http://echodcrypt.netlify.app](http://echodcrypt.netlify.app) and start hiding messages immediately!

### Local Development
```bash
# Clone the repository
git clone https://github.com/Omzee15/Steganography-Tool.git
cd Steganography-Tool

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## 💡 How to Use

### Image Steganography
1. **Encrypt:** Upload an image, enter your secret message, click "Encrypt Image"
2. **Decrypt:** Upload an image with hidden data, click "Decrypt Image" to reveal the message

### Video Steganography
1. **Encrypt:** Upload a video file, enter your message, click "Encrypt Video"
2. **Decrypt:** Upload an encrypted video, click "Decrypt Video" to extract the message

### Capacity Calculator
The app automatically shows you how many characters your uploaded media can store before encryption.

## 🔧 How It Works

### Image Processing
1. **Encoding Process:**
   - Convert text to binary representation
   - Add delimiter (`###END###`) to mark message end
   - Modify the least significant bit of each pixel's RGB values
   - Generate downloadable image with hidden data

2. **Decoding Process:**
   - Extract LSB from each pixel's RGB channels
   - Convert binary data back to text
   - Stop when delimiter is found
   - Display the hidden message

### Video Processing
- Processes video frame-by-frame using Canvas API
- Encodes data across multiple frames for larger capacity
- Uses MediaRecorder API for output video generation
- Maintains video quality while hiding data


## 🛡️ Security & Privacy

- **100% Client-Side:** All processing happens in your browser
- **No Data Upload:** Files never leave your device
- **No Server Storage:** Nothing is saved on external servers
- **Open Source:** Full transparency of the code

⚠️ **Note:** This is for educational/personal use. For sensitive data, consider adding encryption before steganography.



## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the MIT License.


---
