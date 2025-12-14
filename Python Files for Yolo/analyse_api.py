from fastapi import FastAPI, UploadFile, File
import shutil
import os
from analyse import run_analysis  # Your existing analyse.py function

app = FastAPI()

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.post("/analyse")
async def analyse_image(file: UploadFile = File(...)):
    # Save uploaded file
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Run YOLO analysis
    results = run_analysis(file_path)
    return {"results": results}