from PIL import Image
import os

base_path = r'c:\Users\Mazen\Desktop\itqaan\public'
input_file = os.path.join(base_path, 'favicon.png')

def optimize_image(input_path, output_path, size):
    with Image.open(input_path) as img:
        # Convert to RGBA to ensure transparency is preserved
        img = img.convert("RGBA")
        img.thumbnail(size, Image.Resampling.LANCZOS)
        img.save(output_path, "PNG", optimize=True)
        print(f"Saved {output_path} with size {os.path.getsize(output_path)} bytes")

# 1. Favicon (48x48)
optimize_image(input_file, os.path.join(base_path, 'favicon.png'), (48, 48))

# 2. Apple Touch Icon (180x180)
optimize_image(input_file, os.path.join(base_path, 'apple-icon.png'), (180, 180))

# 3. Web Logo (512x512)
optimize_image(input_file, os.path.join(base_path, 'logo.png'), (512, 512))

# 4. Also generate a favicon.ico (multi-size)
with Image.open(input_file) as img:
    img = img.convert("RGBA")
    img.save(os.path.join(base_path, 'favicon.ico'), format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])
    print(f"Saved favicon.ico with size {os.path.getsize(os.path.join(base_path, 'favicon.ico'))} bytes")
