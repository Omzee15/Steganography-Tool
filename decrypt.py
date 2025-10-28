#!/usr/bin/env python3
"""
Decryption Script - LSB Steganography
Supports both command-line and GUI modes.

Usage:
  GUI mode: python3 decrypt.py
  CLI mode: python3 decrypt.py <image_file> [output_text_file]
"""

import sys
import os
import argparse
from pathlib import Path
try:
    import tkinter as tk
    from tkinter import filedialog, messagebox, scrolledtext
    GUI_AVAILABLE = True
except ImportError:
    GUI_AVAILABLE = False
    print("Warning: tkinter not available. GUI mode disabled.")

# Import our steganography functions
from lsb_steganography import decode_text_from_image


class DecryptionGUI:
    """GUI class for the decryption interface."""
    
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("🔓 LSB Steganography - Decrypt")
        self.root.geometry("600x500")
        self.root.resizable(True, True)
        
        # Center the window
        self.center_window()
        
        # Create the interface
        self.create_widgets()
        
    def center_window(self):
        """Center the window on the screen."""
        self.root.update_idletasks()
        x = (self.root.winfo_screenwidth() // 2) - (600 // 2)
        y = (self.root.winfo_screenheight() // 2) - (500 // 2)
        self.root.geometry(f"600x500+{x}+{y}")
        
    def create_widgets(self):
        """Create the GUI widgets."""
        # Title
        title_label = tk.Label(
            self.root, 
            text="🔓 LSB Steganography Decryption", 
            font=("Arial", 16, "bold"),
            fg="#2c3e50"
        )
        title_label.pack(pady=20)
        
        # Instructions
        instructions = tk.Label(
            self.root,
            text="Extract hidden text messages from images using LSB steganography.\nClick the button below to select an image!",
            font=("Arial", 10),
            fg="#34495e",
            justify=tk.CENTER
        )
        instructions.pack(pady=10)
        
        # Main button
        decrypt_btn = tk.Button(
            self.root,
            text="🖼️ Select Image to Decrypt",
            font=("Arial", 12, "bold"),
            bg="#e74c3c",
            fg="white",
            padx=20,
            pady=10,
            command=self.start_decryption,
            cursor="hand2"
        )
        decrypt_btn.pack(pady=20)
        
        # Result frame
        result_frame = tk.LabelFrame(
            self.root,
            text="Decrypted Message",
            font=("Arial", 11, "bold"),
            fg="#2c3e50",
            padx=10,
            pady=10
        )
        result_frame.pack(pady=20, padx=20, fill=tk.BOTH, expand=True)
        
        # Text area for showing decrypted message
        self.result_text = scrolledtext.ScrolledText(
            result_frame,
            wrap=tk.WORD,
            font=("Arial", 11),
            relief=tk.SUNKEN,
            bd=2,
            state=tk.DISABLED
        )
        self.result_text.pack(fill=tk.BOTH, expand=True)
        
        # Button frame for result actions
        result_btn_frame = tk.Frame(result_frame)
        result_btn_frame.pack(pady=10, fill=tk.X)
        
        self.copy_btn = tk.Button(
            result_btn_frame,
            text="📋 Copy to Clipboard",
            command=self.copy_to_clipboard,
            bg="#3498db",
            fg="white",
            state=tk.DISABLED
        )
        self.copy_btn.pack(side=tk.LEFT)
        
        self.save_btn = tk.Button(
            result_btn_frame,
            text="💾 Save to File",
            command=self.save_to_file,
            bg="#27ae60",
            fg="white",
            state=tk.DISABLED
        )
        self.save_btn.pack(side=tk.LEFT, padx=(10, 0))
        
        self.clear_btn = tk.Button(
            result_btn_frame,
            text="🗑️ Clear",
            command=self.clear_result,
            bg="#95a5a6",
            fg="white",
            state=tk.DISABLED
        )
        self.clear_btn.pack(side=tk.RIGHT)
        
        # Status frame
        status_frame = tk.Frame(self.root)
        status_frame.pack(pady=10, fill=tk.X, padx=20)
        
        self.status_label = tk.Label(
            status_frame,
            text="Ready to decrypt...",
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
        
    def start_decryption(self):
        """Start the decryption process."""
        try:
            # Select image file
            self.status_label.config(text="Selecting image file...", fg="#f39c12")
            self.root.update()
            
            image_path = filedialog.askopenfilename(
                title="Select Image File to Decrypt",
                filetypes=[
                    ("Image files", "*.png *.jpg *.jpeg *.bmp *.tiff *.gif"),
                    ("PNG files", "*.png"),
                    ("JPEG files", "*.jpg *.jpeg"),
                    ("All files", "*.*")
                ],
                initialdir=os.getcwd()
            )
            
            if not image_path:
                self.status_label.config(text="No image selected. Ready to decrypt...", fg="#7f8c8d")
                return
                
            # Perform decryption
            self.status_label.config(text="Decrypting message from image...", fg="#f39c12")
            self.root.update()
            
            # Capture the output from decode function
            import io
            from contextlib import redirect_stdout
            
            output_buffer = io.StringIO()
            with redirect_stdout(output_buffer):
                decoded_message = decode_text_from_image(image_path)
            
            if decoded_message:
                # Success - show the decoded message
                self.show_result(decoded_message, Path(image_path).name)
                self.status_label.config(text="✅ Decryption completed successfully!", fg="#27ae60")
            else:
                # No message found
                self.status_label.config(text="❌ No hidden message found in image", fg="#e74c3c")
                messagebox.showwarning(
                    "No Message Found",
                    f"No hidden message was found in the selected image.\n\n"
                    f"This could mean:\n"
                    f"• The image doesn't contain any hidden text\n"
                    f"• The image was not created with this tool\n"
                    f"• The image was compressed or modified after encryption"
                )
                
        except Exception as e:
            self.status_label.config(text="❌ Decryption failed!", fg="#e74c3c")
            messagebox.showerror("Decryption Error", f"An error occurred:\n{str(e)}")
            
    def show_result(self, message, filename):
        """Show the decrypted message in the text area."""
        # Enable text area temporarily
        self.result_text.config(state=tk.NORMAL)
        
        # Clear and insert new content
        self.result_text.delete(1.0, tk.END)
        self.result_text.insert(1.0, message)
        
        # Disable text area to prevent editing
        self.result_text.config(state=tk.DISABLED)
        
        # Enable buttons
        self.copy_btn.config(state=tk.NORMAL)
        self.save_btn.config(state=tk.NORMAL)
        self.clear_btn.config(state=tk.NORMAL)
        
        # Store message for saving
        self.current_message = message
        self.current_filename = filename
        
        # Show success dialog
        messagebox.showinfo(
            "Decryption Complete",
            f"Hidden message successfully extracted!\n\n"
            f"📁 Source: {filename}\n"
            f"📝 Message length: {len(message)} characters\n\n"
            f"The message is displayed below and you can copy or save it."
        )
        
    def copy_to_clipboard(self):
        """Copy the decrypted message to clipboard."""
        try:
            self.root.clipboard_clear()
            self.root.clipboard_append(self.current_message)
            self.root.update()  # Ensure clipboard is updated
            messagebox.showinfo("Copied", "Message copied to clipboard!")
        except Exception as e:
            messagebox.showerror("Error", f"Could not copy to clipboard:\n{str(e)}")
            
    def save_to_file(self):
        """Save the decrypted message to a file."""
        try:
            file_path = filedialog.asksaveasfilename(
                title="Save Decrypted Message",
                defaultextension=".txt",
                filetypes=[
                    ("Text files", "*.txt"),
                    ("All files", "*.*")
                ],
                initialdir=os.getcwd(),
                initialfile=f"decrypted_message_{Path(self.current_filename).stem}.txt"
            )
            
            if file_path:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(self.current_message)
                messagebox.showinfo("Saved", f"Message saved to:\n{file_path}")
                
        except Exception as e:
            messagebox.showerror("Error", f"Could not save file:\n{str(e)}")
            
    def clear_result(self):
        """Clear the result area."""
        self.result_text.config(state=tk.NORMAL)
        self.result_text.delete(1.0, tk.END)
        self.result_text.config(state=tk.DISABLED)
        
        # Disable buttons
        self.copy_btn.config(state=tk.DISABLED)
        self.save_btn.config(state=tk.DISABLED)
        self.clear_btn.config(state=tk.DISABLED)
        
        self.status_label.config(text="Ready to decrypt...", fg="#7f8c8d")
        
    def run(self):
        """Run the GUI application."""
        self.root.mainloop()


def cli_mode(args):
    """Handle command-line mode."""
    image_file = args.image
    output_file = args.output
    
    # Check if image file exists
    if not os.path.exists(image_file):
        print(f"❌ Error: Image file '{image_file}' not found!")
        sys.exit(1)
    
    try:
        print(f"🔓 Decrypting message from image...")
        decoded_message = decode_text_from_image(image_file)
        
        if decoded_message:
            print(f"✅ Success! Message extracted from: {image_file}")
            print(f"📝 Message length: {len(decoded_message)} characters")
            
            # Save to file if output specified
            if output_file:
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(decoded_message)
                print(f"💾 Message saved to: {output_file}")
            else:
                print(f"\n📄 Decrypted Message:")
                print("-" * 50)
                print(decoded_message)
                print("-" * 50)
        else:
            print("❌ No hidden message found in the image!")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Decryption failed: {str(e)}")
        sys.exit(1)


def main():
    """Main function."""
    parser = argparse.ArgumentParser(
        description="LSB Steganography Decryption Tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  GUI mode:
    python3 decrypt.py
  
  CLI mode:
    python3 decrypt.py encrypted_image.png
    python3 decrypt.py hidden_message.png decrypted_message.txt
        """
    )
    
    parser.add_argument('image', nargs='?', help='Input image file with hidden message')
    parser.add_argument('output', nargs='?', help='Output text file (optional, prints to console if not specified)')
    
    args = parser.parse_args()
    
    # Check if running in CLI or GUI mode
    if args.image:
        # CLI mode
        cli_mode(args)
    else:
        # GUI mode
        if not GUI_AVAILABLE:
            print("❌ Error: GUI mode requires tkinter, but it's not available.")
            print("Use CLI mode instead:")
            print("python3 decrypt.py <image_file> [output_text_file]")
            sys.exit(1)
        
        print("🔓 Starting LSB Steganography Decryption GUI...")
        app = DecryptionGUI()
        app.run()


if __name__ == "__main__":
    main()