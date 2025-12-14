import os
import platform
import subprocess
import sys

# -----------------------------
# Paths
# -----------------------------
BASE_PATH = os.path.abspath(os.path.dirname(__file__))
MAIN_SCRIPT = os.path.join(BASE_PATH, "main.py")  # Your main PyQt6 app
DIST_DIR = os.path.join(BASE_PATH, "dist")
BUILD_DIR = os.path.join(BASE_PATH, "build")

# Resources to include (logo, sample images, models)
ADD_DATA = [
    os.path.join(BASE_PATH, "resources", "logo.png"),
    os.path.join(BASE_PATH, "resources", "sample_images"),
    os.path.join(BASE_PATH, "runs", "detect")  # YOLO model folders
]

# Format --add-data for PyInstaller depending on OS
def format_add_data(path_list):
    formatted = []
    sep = ":" if platform.system() != "Windows" else ";"
    for path in path_list:
        dest = os.path.basename(path)
        formatted.append(f"{path}{sep}{dest}")
    return formatted

add_data_args = []
for item in format_add_data(ADD_DATA):
    add_data_args.append("--add-data")
    add_data_args.append(item)

# -----------------------------
# Build command
# -----------------------------
exe_name = "BloodCellIdentifier"
if platform.system() == "Windows":
    exe_name += ".exe"

cmd = [
    sys.executable,
    "-m",
    "PyInstaller",
    "--noconfirm",
    "--onefile",
    "--windowed",
    "--name",
    exe_name,
    MAIN_SCRIPT
] + add_data_args

# -----------------------------
# Run build
# -----------------------------
print("Building executable...")
subprocess.run(cmd, check=True)
print(f"✅ Build finished! Check the dist/ folder for {exe_name}")