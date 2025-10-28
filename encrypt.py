#!/usr/bin/env python3
"""
Encryption Script - LSB Steganography
Supports both command-line and GUI modes.

Usage:
  GUI mode: python3 encrypt.py
  CLI mode: python3 encrypt.py <image_file> <text_file_or_message> [output_file]
"""

import sys
import os
import argparse
from pathlib import Path
try:
    import tkinter as tk
    from tkinter import filedialog, messagebox, simpledialog
    GUI_AVAILABLE = True
except ImportError:
    GUI_AVAILABLE = False
    print("Warning: tkinter not available. GUI mode disabled.")

# Import our steganography functions
from lsb_steganography import encode_text_in_image


class EncryptionGUI:
    """GUI class for the encryption interface."""
    
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("🔐 LSB Steganography - Encrypt")
        self.root.geometry("500x300")
        self.root.resizable(False, False)
        
        # Center the window
        self.center_window()
        
        # Create the interface
        self.create_widgets()
        
    def center_window(self):
        """Center the window on the screen."""
        self.root.update_idletasks()
        x = (self.root.winfo_screenwidth() // 2) - (500 // 2)
        y = (self.root.winfo_screenheight() // 2) - (300 // 2)
        self.root.geometry(f"500x300+{x}+{y}")
        
    def create_widgets(self):
        """Create the GUI widgets."""
        # Title
        title_label = tk.Label(
            self.root, 
            text="🔐 LSB Steganography Encryption", 
            font=("Arial", 16, "bold"),
            fg="#2c3e50"
        )
        title_label.pack(pady=20)
        
        # Instructions
        instructions = tk.Label(
            self.root,
            text="Hide secret text messages in images using LSB steganography.\nClick the button below to start!",
            font=("Arial", 10),
            fg="#34495e",
            justify=tk.CENTER
        )
        instructions.pack(pady=10)
        
        # Main button
        encrypt_btn = tk.Button(
            self.root,
            text="🖼️ Select Image & Enter Message",
            font=("Arial", 12, "bold"),
            bg="#3498db",
            fg="white",
            padx=20,
            pady=10,
            command=self.start_encryption,
            cursor="hand2"
        )
        encrypt_btn.pack(pady=30)
        
        # Status frame
        status_frame = tk.Frame(self.root)
        status_frame.pack(pady=20, fill=tk.X, padx=20)
        
        self.status_label = tk.Label(
            status_frame,
            text="Ready to encrypt...",
            font=("Arial", 9),
            fg="#7f8c8d"
        )
        self.status_label.pack()
        
        # Exit button
        exit_btn = tk.Button(
            self.root,
            text="Exit",
            font=("Arial", 10),
            bg="#e74c3c",
            fg="white",
            padx=15,
            pady=5,
            command=self.root.quit,
            cursor="hand2"
        )
        exit_btn.pack(side=tk.BOTTOM, pady=10)
        
    def show_image_capacity(self, image_path):
        """Analyze and display the image capacity for hiding text."""
        try:
            from PIL import Image
            import numpy as np
            
            # Open and analyze the image
            img = Image.open(image_path)
            img = img.convert('RGB')
            img_array = np.array(img)
            
            # Calculate capacity
            height, width, channels = img_array.shape
            total_pixels = height * width
            total_bits = total_pixels * channels
            max_chars = (total_bits // 8) - 9  # -9 for delimiter
            
            # Calculate file size
            file_size = os.path.getsize(image_path)
            file_size_mb = file_size / (1024 * 1024)
            
            # Show capacity info
            capacity_info = (
                f"📸 Image Analysis: {Path(image_path).name}\n"
                f"📏 Dimensions: {width} × {height} pixels\n"
                f"💾 File Size: {file_size_mb:.2f} MB\n"
                f"📊 Total Pixels: {total_pixels:,}\n"
                f"📝 Maximum Characters: {max_chars:,}\n"
                f"📄 Estimated Pages: ~{max_chars // 500} (500 chars/page)\n"
                f"📧 Estimated Emails: ~{max_chars // 1500} (1500 chars/email)"
            )
            
            messagebox.showinfo("Image Capacity", capacity_info)
            
        except Exception as e:
            messagebox.showwarning("Warning", f"Could not analyze image capacity: {str(e)}")
    
    def start_encryption(self):
        """Start the encryption process."""
        try:
            # Step 1: Select image file
            self.status_label.config(text="Selecting image file...", fg="#f39c12")
            self.root.update()
            
            image_path = filedialog.askopenfilename(
                title="Select Image File",
                filetypes=[
                    ("Image files", "*.png *.jpg *.jpeg *.bmp *.tiff *.gif"),
                    ("PNG files", "*.png"),
                    ("JPEG files", "*.jpg *.jpeg"),
                    ("All files", "*.*")
                ],
                initialdir=os.getcwd()
            )
            
            if not image_path:
                self.status_label.config(text="No image selected. Ready to encrypt...", fg="#7f8c8d")
                return
                
            # Analyze image capacity
            self.show_image_capacity(image_path)
                
            # Step 2: Get text message
            self.status_label.config(text="Getting secret message...", fg="#f39c12")
            self.root.update()
            
            message = self.get_message()
            if not message:
                self.status_label.config(text="No message entered. Ready to encrypt...", fg="#7f8c8d")
                return
                
            # Step 3: Select output location
            self.status_label.config(text="Selecting output location...", fg="#f39c12")
            self.root.update()
            
            output_path = filedialog.asksaveasfilename(
                title="Save Encrypted Image As",
                defaultextension=".png",
                filetypes=[
                    ("PNG files", "*.png"),
                    ("JPEG files", "*.jpg"),
                    ("All files", "*.*")
                ],
                initialdir=os.path.dirname(image_path),
                initialfile=f"encrypted_{Path(image_path).stem}.png"
            )
            
            if not output_path:
                self.status_label.config(text="No output location selected. Ready to encrypt...", fg="#7f8c8d")
                return
                
            # Step 4: Perform encryption
            self.status_label.config(text="Encrypting message into image...", fg="#f39c12")
            self.root.update()
            
            encode_text_in_image(image_path, message, output_path)
            
            # Success message
            self.status_label.config(text="✅ Encryption completed successfully!", fg="#27ae60")
            messagebox.showinfo(
                "Encryption Complete",
                f"Message successfully hidden in image!\n\n"
                f"📁 Original: {Path(image_path).name}\n"
                f"💾 Encrypted: {Path(output_path).name}\n"
                f"📝 Message length: {len(message)} characters"
            )
            
        except Exception as e:
            self.status_label.config(text="❌ Encryption failed!", fg="#e74c3c")
            messagebox.showerror("Encryption Error", f"An error occurred:\n{str(e)}")
            
    def get_message(self):
        """Get message from user with multiple input options."""
        # Create a custom dialog for message input
        dialog = MessageInputDialog(self.root)
        return dialog.result
        
    def run(self):
        """Run the GUI application."""
        self.root.mainloop()


class MessageInputDialog:
    """Custom dialog for message input with options."""
    
    def __init__(self, parent):
        self.result = None
        
        # Create dialog window
        self.dialog = tk.Toplevel(parent)
        self.dialog.title("Enter Secret Message")
        self.dialog.geometry("600x400")
        self.dialog.resizable(True, True)
        self.dialog.transient(parent)
        self.dialog.grab_set()
        
        # Center the dialog
        self.center_dialog(parent)
        
        # Create widgets
        self.create_dialog_widgets()
        
        # Wait for dialog to close
        self.dialog.wait_window()
        
    def center_dialog(self, parent):
        """Center the dialog relative to parent."""
        parent.update_idletasks()
        x = parent.winfo_x() + (parent.winfo_width() // 2) - 300
        y = parent.winfo_y() + (parent.winfo_height() // 2) - 200
        self.dialog.geometry(f"600x400+{x}+{y}")
        
    def create_dialog_widgets(self):
        """Create dialog widgets."""
        # Title
        title = tk.Label(self.dialog, text="Enter Your Secret Message", font=("Arial", 14, "bold"))
        title.pack(pady=10)
        
        # Instructions
        instructions = tk.Label(
            self.dialog,
            text="Type your message below or load from a text file:",
            font=("Arial", 10)
        )
        instructions.pack(pady=5)
        
        # Text area frame
        text_frame = tk.Frame(self.dialog)
        text_frame.pack(pady=10, padx=20, fill=tk.BOTH, expand=True)
        
        # Text area with scrollbar
        text_scroll = tk.Scrollbar(text_frame)
        text_scroll.pack(side=tk.RIGHT, fill=tk.Y)
        
        self.text_area = tk.Text(
            text_frame,
            wrap=tk.WORD,
            yscrollcommand=text_scroll.set,
            font=("Arial", 11),
            relief=tk.SUNKEN,
            bd=2
        )
        self.text_area.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        text_scroll.config(command=self.text_area.yview)
        
        # Button frame
        button_frame = tk.Frame(self.dialog)
        button_frame.pack(pady=10, fill=tk.X)
        
        # Load file button
        load_btn = tk.Button(
            button_frame,
            text="📁 Load from File",
            command=self.load_from_file,
            bg="#3498db",
            fg="white",
            padx=10
        )
        load_btn.pack(side=tk.LEFT, padx=(20, 5))
        
        # Clear button
        clear_btn = tk.Button(
            button_frame,
            text="🗑️ Clear",
            command=self.clear_text,
            bg="#95a5a6",
            fg="white",
            padx=10
        )
        clear_btn.pack(side=tk.LEFT, padx=5)
        
        # Cancel button
        cancel_btn = tk.Button(
            button_frame,
            text="Cancel",
            command=self.cancel,
            bg="#e74c3c",
            fg="white",
            padx=10
        )
        cancel_btn.pack(side=tk.RIGHT, padx=(5, 20))
        
        # OK button
        ok_btn = tk.Button(
            button_frame,
            text="✅ Use This Message",
            command=self.ok,
            bg="#27ae60",
            fg="white",
            padx=10,
            font=("Arial", 10, "bold")
        )
        ok_btn.pack(side=tk.RIGHT, padx=5)
        
        # Focus on text area
        self.text_area.focus()
        
    def load_from_file(self):
        """Load text from a file."""
        file_path = filedialog.askopenfilename(
            title="Select Text File",
            filetypes=[
                ("Text files", "*.txt"),
                ("All files", "*.*")
            ]
        )
        
        if file_path:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    self.text_area.delete(1.0, tk.END)
                    self.text_area.insert(1.0, content)
            except Exception as e:
                messagebox.showerror("Error", f"Could not load file:\n{str(e)}")
                
    def clear_text(self):
        """Clear the text area."""
        self.text_area.delete(1.0, tk.END)
        
    def ok(self):
        """Accept the message."""
        message = self.text_area.get(1.0, tk.END).strip()
        if not message:
            messagebox.showwarning("Warning", "Please enter a message or load from file.")
            return
        self.result = message
        self.dialog.destroy()
        
    def cancel(self):
        """Cancel the dialog."""
        self.result = None
        self.dialog.destroy()


def analyze_image_capacity(image_file):
    """Analyze and display image capacity for hiding text."""
    try:
        from PIL import Image
        import numpy as np
        
        # Open and analyze the image
        img = Image.open(image_file)
        img = img.convert('RGB')
        img_array = np.array(img)
        
        # Calculate capacity
        height, width, channels = img_array.shape
        total_pixels = height * width
        total_bits = total_pixels * channels
        max_chars = (total_bits // 8) - 9  # -9 for delimiter
        
        # Calculate file size
        file_size = os.path.getsize(image_file)
        file_size_mb = file_size / (1024 * 1024)
        
        print(f"📸 Image Analysis: {Path(image_file).name}")
        print(f"📏 Dimensions: {width} × {height} pixels")
        print(f"💾 File Size: {file_size_mb:.2f} MB")
        print(f"📊 Total Pixels: {total_pixels:,}")
        print(f"📝 Maximum Characters: {max_chars:,}")
        print(f"📄 Estimated Pages: ~{max_chars // 500} (500 chars/page)")
        print(f"📧 Estimated Emails: ~{max_chars // 1500} (1500 chars/email)")
        print("-" * 50)
        
        return max_chars
        
    except Exception as e:
        print(f"⚠️  Warning: Could not analyze image capacity: {str(e)}")
        return None


def cli_mode(args):
    """Handle command-line mode."""
    image_file = args.image
    text_input = args.text
    output_file = args.output
    
    # Check if image file exists
    if not os.path.exists(image_file):
        print(f"❌ Error: Image file '{image_file}' not found!")
        sys.exit(1)
    
    # Analyze image capacity first
    max_capacity = analyze_image_capacity(image_file)
    
    # Handle text input (file or direct text)
    if os.path.exists(text_input):
        # It's a file, read the content
        try:
            with open(text_input, 'r', encoding='utf-8') as f:
                message = f.read().strip()
            print(f"📁 Loaded message from file: {text_input}")
        except Exception as e:
            print(f"❌ Error reading text file: {str(e)}")
            sys.exit(1)
    else:
        # It's direct text
        message = text_input
        print(f"📝 Using provided message")
    
    if not message:
        print("❌ Error: No message to encrypt!")
        sys.exit(1)
    
    # Check message size against capacity
    message_length = len(message)
    print(f"📝 Message length: {message_length} characters")
    
    if max_capacity and message_length > max_capacity:
        print(f"❌ Error: Message too long! Maximum: {max_capacity:,} characters")
        sys.exit(1)
    elif max_capacity:
        percentage = (message_length / max_capacity) * 100
        print(f"📊 Capacity usage: {percentage:.1f}% ({message_length:,}/{max_capacity:,})")
    
    # Set default output if not provided
    if not output_file:
        image_path = Path(image_file)
        output_file = f"encrypted_{image_path.stem}.png"
    
    try:
        print(f"🔒 Encrypting message into image...")
        encode_text_in_image(image_file, message, output_file)
        print(f"✅ Success! Encrypted image saved as: {output_file}")
    except Exception as e:
        print(f"❌ Encryption failed: {str(e)}")
        sys.exit(1)


def main():
    """Main function."""
    parser = argparse.ArgumentParser(
        description="LSB Steganography Encryption Tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  GUI mode:
    python3 encrypt.py
  
  CLI mode:
    python3 encrypt.py image.jpg "Secret message"
    python3 encrypt.py image.jpg message.txt output.png
    python3 encrypt.py photo.png "Hello World" encrypted.png
        """
    )
    
    parser.add_argument('image', nargs='?', help='Input image file')
    parser.add_argument('text', nargs='?', help='Text message or text file path')
    parser.add_argument('output', nargs='?', help='Output image file (optional)')
    
    args = parser.parse_args()
    
    # Check if running in CLI or GUI mode
    if args.image and args.text:
        # CLI mode
        cli_mode(args)
    else:
        # GUI mode
        if not GUI_AVAILABLE:
            print("❌ Error: GUI mode requires tkinter, but it's not available.")
            print("Use CLI mode instead:")
            print("python3 encrypt.py <image_file> <text_file_or_message> [output_file]")
            sys.exit(1)
        
        print("🔐 Starting LSB Steganography Encryption GUI...")
        app = EncryptionGUI()
        app.run()


if __name__ == "__main__":
    main()