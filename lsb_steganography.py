#!/usr/bin/env python3
"""
LSB Steganography Script
This script implements Least Significant Bit (LSB) steganography to hide text data in images.
It can both encode text into images and decode text from images.
"""

import argparse
import sys
from PIL import Image
import numpy as np


def text_to_binary(text):
    """Convert text to binary representation using UTF-8 encoding."""
    binary = ''.join(format(byte, '08b') for byte in text.encode('utf-8'))
    return binary


def binary_to_text(binary):
    """Convert binary representation back to text using UTF-8 encoding."""
    bytes_list = []
    for i in range(0, len(binary), 8):
        byte = binary[i:i+8]
        if len(byte) == 8:
            bytes_list.append(int(byte, 2))
    
    try:
        return bytes(bytes_list).decode('utf-8')
    except UnicodeDecodeError:
        return bytes(bytes_list).decode('utf-8', errors='ignore')


def encode_text_in_image(image_path, text, output_path):
    """
    Encode text into an image using LSB steganography.
    
    Args:
        image_path (str): Path to the input image
        text (str): Text to hide in the image
        output_path (str): Path to save the output image
    """
    try:
        # Open the image
        img = Image.open(image_path)
        img = img.convert('RGB')  # Ensure RGB format
        img_array = np.array(img)
        
        # Convert text to binary and add delimiter
        text_binary = text_to_binary(text + '###END###')
        
        # Check if image is large enough to hold the text
        total_pixels = img_array.shape[0] * img_array.shape[1]
        max_chars = (total_pixels * 3) // 8  # 3 channels, 8 bits per char
        
        if len(text) > max_chars - 9:  # -9 for the delimiter
            raise ValueError(f"Text too long! Maximum characters: {max_chars - 9}")
        
        # Flatten the image array for easier manipulation
        flat_img = img_array.flatten()
        
        # Encode the text
        for i, bit in enumerate(text_binary):
            if i < len(flat_img):
                # Modify the LSB of the current pixel value
                flat_img[i] = (flat_img[i] & 0xFE) | int(bit)
        
        # Reshape back to original image shape
        encoded_img_array = flat_img.reshape(img_array.shape)
        
        # Save the encoded image
        encoded_img = Image.fromarray(encoded_img_array.astype('uint8'))
        encoded_img.save(output_path)
        
        print(f"✅ Text successfully encoded into image!")
        print(f"📁 Original image: {image_path}")
        print(f"💾 Encoded image saved as: {output_path}")
        print(f"📝 Hidden text length: {len(text)} characters")
        
    except FileNotFoundError:
        print(f"❌ Error: Image file '{image_path}' not found!")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error encoding text: {str(e)}")
        sys.exit(1)


def decode_text_from_image(image_path):
    """
    Decode hidden text from an image using LSB steganography.
    
    Args:
        image_path (str): Path to the image containing hidden text
        
    Returns:
        str: The decoded text
    """
    try:
        # Open the image
        img = Image.open(image_path)
        img = img.convert('RGB')
        img_array = np.array(img)
        
        # Flatten the image array
        flat_img = img_array.flatten()
        
        # Extract LSBs to form binary string
        binary_string = ''
        delimiter_binary = text_to_binary('###END###')
        
        # Extract enough bits to find the delimiter
        max_bits_needed = len(flat_img)
        
        for i in range(min(max_bits_needed, len(flat_img))):
            binary_string += str(flat_img[i] & 1)
            
            # Check if we have enough bits and if we found the delimiter
            if len(binary_string) >= len(delimiter_binary):
                # Check for delimiter in the current binary string
                try:
                    decoded_so_far = binary_to_text(binary_string)
                    if '###END###' in decoded_so_far:
                        # Found the delimiter, extract the message
                        end_pos = decoded_so_far.find('###END###')
                        final_text = decoded_so_far[:end_pos]
                        
                        print(f"✅ Text successfully decoded from image!")
                        print(f"📁 Source image: {image_path}")
                        print(f"📝 Decoded text length: {len(final_text)} characters")
                        print(f"📄 Decoded text:")
                        print("-" * 50)
                        print(final_text)
                        print("-" * 50)
                        return final_text
                except UnicodeDecodeError:
                    # Continue if we can't decode yet
                    continue
        
        print("❌ No hidden text found or text is corrupted!")
        return ""
        
    except FileNotFoundError:
        print(f"❌ Error: Image file '{image_path}' not found!")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error decoding text: {str(e)}")
        sys.exit(1)


def main():
    """Main function to handle command line arguments."""
    parser = argparse.ArgumentParser(
        description="LSB Steganography Tool - Hide and reveal text in images",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Encode text into an image
  python lsb_steganography.py encode input.jpg "Secret message" output.png
  
  # Decode text from an image
  python lsb_steganography.py decode output.png
  
  # Encode text from a file
  python lsb_steganography.py encode input.jpg "$(cat message.txt)" output.png
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Encode command
    encode_parser = subparsers.add_parser('encode', help='Encode text into an image')
    encode_parser.add_argument('image', help='Input image file path')
    encode_parser.add_argument('text', help='Text to hide in the image')
    encode_parser.add_argument('output', help='Output image file path')
    
    # Decode command
    decode_parser = subparsers.add_parser('decode', help='Decode text from an image')
    decode_parser.add_argument('image', help='Image file path containing hidden text')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    print("🔐 LSB Steganography Tool")
    print("=" * 40)
    
    if args.command == 'encode':
        encode_text_in_image(args.image, args.text, args.output)
    elif args.command == 'decode':
        decode_text_from_image(args.image)


if __name__ == "__main__":
    main()