import zipfile
import os

zip_filename = 'erosae_app_source.zip'

if os.path.exists(zip_filename):
    os.remove(zip_filename)

with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as z:
    for f in ['package.json', 'package-lock.json', 'next.config.mjs', 'tsconfig.json', 'tailwind.config.js', 'postcss.config.js', '.env']:
        if os.path.exists(f):
            z.write(f)
            print(f"Added file: {f}")

    for d in ['prisma', 'public', 'src']:
        if os.path.exists(d):
            for root, _, files in os.walk(d):
                for f in files:
                    full_path = os.path.join(root, f)
                    rel_path = os.path.relpath(full_path)
                    z.write(full_path, rel_path)
            print(f"Added directory: {d}")

print(f"Successfully created {zip_filename}: {os.path.getsize(zip_filename)} bytes")
