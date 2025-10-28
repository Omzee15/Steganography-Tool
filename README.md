# LSB Steganography Tool 🔐

A Python implementation of Least Significant Bit (LSB) steganography for hiding text data in images.

## What is LSB Steganography?

LSB steganography is a technique that hides information by modifying the least significant bit of each pixel value in an image. Since the LSB contributes minimally to the overall pixel value, changes are virtually invisible to the human eye.

## Features

- 📸 Hide text messages in images (PNG, JPEG, etc.)
- 🔍 Extract hidden text from images
- 🛡️ Automatic text length validation
- 📏 Support for large text messages
- 🎨 Preserves image quality (minimal visual impact)
- 🚀 Easy-to-use command-line interface

## Installation

1. Make sure you have Python 3.6+ installed
2. Install required packages:
```bash
pip install Pillow numpy
```

## Usage

### Command Line Interface

**Encode text into an image:**
```bash
python lsb_steganography.py encode input_image.jpg "Your secret message" output_image.png
```

**Decode text from an image:**
```bash
python lsb_steganography.py decode output_image.png
```

**Encode text from a file:**
```bash
python lsb_steganography.py encode input.jpg "$(cat secret.txt)" output.png
```

### Python Script Usage

```python
from lsb_steganography import encode_text_in_image, decode_text_from_image

# Encode text
encode_text_in_image("input.jpg", "Secret message", "output.png")

# Decode text
decoded_text = decode_text_from_image("output.png")
print(decoded_text)
```

## Demo

Run the demo script to see the steganography in action:

```bash
python demo.py
```

This will:
1. Create a sample image
2. Hide a secret message in the image
3. Extract the message from the image
4. Verify that the process worked correctly

## How It Works

1. **Encoding Process:**
   - Convert the text to binary representation
   - Add a delimiter (`###END###`) to mark the end of the message
   - Modify the least significant bit of each pixel value
   - Save the modified image

2. **Decoding Process:**
   - Extract the least significant bit from each pixel
   - Convert the binary data back to text
   - Stop when the delimiter is found
   - Return the hidden message

## File Size Considerations

The maximum text length depends on the image size:
- **Formula:** `max_chars = (width × height × 3) ÷ 8 - 9`
- **Example:** 800×600 image can hide ~179,991 characters

## Security Notes

⚠️ **Important:** This is a basic implementation for educational purposes. For sensitive data:
- Consider adding encryption before steganography
- Use more sophisticated techniques
- Be aware that LSB steganography can be detected by steganalysis tools

## Examples

### Basic Text Hiding
```bash
# Hide a simple message
python lsb_steganography.py encode photo.jpg "Hello, World!" hidden.png

# Retrieve the message
python lsb_steganography.py decode hidden.png
```

### Hide a Long Text File
```bash
# Hide contents of a text file
python lsb_steganography.py encode landscape.jpg "$(cat story.txt)" secret_image.png
```

## Technical Details

- **Supported formats:** PNG, JPEG, BMP, TIFF, etc. (anything PIL supports)
- **Color channels:** Works with RGB images (3 channels)
- **Bit manipulation:** Modifies only the LSB of each color channel
- **Delimiter:** Uses `###END###` to mark the end of hidden text

## Dependencies

- **Pillow (PIL):** For image processing
- **NumPy:** For efficient array operations
- **Python 3.6+:** Core language support

## License

This project is open source and available under the MIT License.

## Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

---

**Happy hiding! 🕵️‍♂️**