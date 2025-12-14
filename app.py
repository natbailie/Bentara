import streamlit as st
from ultralytics import YOLO
from collections import Counter
import cv2
import os
import pandas as pd
import glob
import numpy as np

# -----------------------------
# Model paths
# -----------------------------
MODEL_PATHS = {
    "Neutrophil": "runs/detect/Neutrophil_detector/weights/best.pt",
    "Lymphocyte": "runs/detect/Lymphocyte_detector/weights/best.pt",
    "Monocyte": "runs/detect/Monocyte_detector/weights/best.pt",
    "Eosinophil": "runs/detect/Eosinophil_detector/weights/best.pt",
    "TXL-PBC": "runs/detect/blood_cell_detector/weights/best.pt"
}

# -----------------------------
# Load multiple models (safe)
# -----------------------------
MODELS = {}
for name, path in MODEL_PATHS.items():
    if os.path.exists(path):
        MODELS[name] = YOLO(path)
        print(f"✅ Loaded {name} model from {path}")
    else:
        print(f"⚠️ Skipping {name}, model not found at {path}")

if not MODELS:
    raise RuntimeError("❌ No models could be loaded. Check your paths in MODEL_PATHS.")

# -----------------------------
# Label normalization
# -----------------------------
LABEL_ALIASES = {
    "Neutrophil": ["Neutrophil", "Band"],
    "Lymphocyte": ["Small Lymph", "Large Lymph", "Lymphocyte"],
    "Monocyte": ["Monocyte"],
    "Eosinophil": ["Eosinophil"],
    "Basophil": ["Basophil"],
    "Platelet": ["Platelet", "Thrombocyte"],
    "RBC": ["RBC", "Red Blood Cell", "Erythrocyte"]
}

def normalize_label(label: str) -> str:
    for canonical, aliases in LABEL_ALIASES.items():
        if label.lower() in [a.lower() for a in aliases]:
            return canonical
    return label  # fallback

# -----------------------------
# Streamlit UI
# -----------------------------
st.title("🩸 Blood Cell Identifier (YOLOv8 Ensemble)")

mode = st.radio("Choose input mode:", ["Upload Images", "Process Folder"])

results_data = []

# -----------------------------
# Helper: Run all models
# -----------------------------
def run_models_on_image(img_path):
    merged_counts = Counter()
    annotated_frames = []

    for model_name, model in MODELS.items():
        results = model.predict(source=img_path, conf=0.25, save=False, verbose=False)
        result = results[0]

        # Count detections
        names = model.names
        class_ids = [int(box.cls) for box in result.boxes]
        counts = Counter([normalize_label(names[c]) for c in class_ids])
        merged_counts.update(counts)

        # Annotated frame
        annotated_frames.append(result.plot())

    # Merge annotations visually
    merged_img = annotated_frames[0]
    for overlay in annotated_frames[1:]:
        mask = overlay > 0
        merged_img[mask] = overlay[mask]

    return merged_counts, merged_img

# -----------------------------
# Mode 1: Upload Images
# -----------------------------
if mode == "Upload Images":
    uploaded_files = st.file_uploader(
        "Upload one or more blood smear images",
        type=["jpg", "png", "jpeg"],
        accept_multiple_files=True
    )

    if uploaded_files:
        for uploaded_file in uploaded_files:
            # Save temporarily
            img_path = os.path.join("temp", uploaded_file.name)
            os.makedirs("temp", exist_ok=True)
            with open(img_path, "wb") as f:
                f.write(uploaded_file.getbuffer())

            counts, annotated_img = run_models_on_image(img_path)

            # Show annotated image
            st.image(cv2.cvtColor(annotated_img, cv2.COLOR_BGR2RGB),
                     caption=f"Detections for {uploaded_file.name}",
                     use_column_width=True)

            # Show counts
            st.subheader(f"Counts for {uploaded_file.name}")
            st.json(dict(counts))

            # Save for CSV
            row = {"image": uploaded_file.name}
            row.update(counts)
            results_data.append(row)

# -----------------------------
# Mode 2: Process Folder
# -----------------------------
elif mode == "Process Folder":
    folder_path = st.text_input("Enter path to image folder:",
                                value="/Users/natbailie/Documents/Blood Cell Identifier Project/Datasets/TXL-PBC/images/test")

    if st.button("Run Detection on Folder"):
        image_files = glob.glob(os.path.join(folder_path, "*.jpg")) + \
                      glob.glob(os.path.join(folder_path, "*.png")) + \
                      glob.glob(os.path.join(folder_path, "*.jpeg"))

        for img_path in image_files:
            img_name = os.path.basename(img_path)
            counts, _ = run_models_on_image(img_path)

            row = {"image": img_name}
            row.update(counts)
            results_data.append(row)

        st.success(f"Processed {len(image_files)} images from {folder_path}")

# -----------------------------
# Results Table + CSV Download
# -----------------------------
if len(results_data) > 0:
    df = pd.DataFrame(results_data).fillna(0)

    st.subheader("📊 Results Table (merged categories)")
    st.dataframe(df)

    # Download button for CSV
    csv = df.to_csv(index=False).encode("utf-8")
    st.download_button(
        label="⬇️ Download results as CSV",
        data=csv,
        file_name="cell_counts.csv",
        mime="text/csv",
    )

# cd "/Users/natbailie/Documents/Blood Cell Identifier Project"
# streamlit run app.py