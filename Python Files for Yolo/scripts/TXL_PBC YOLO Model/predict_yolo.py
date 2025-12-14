from ultralytics import YOLO

def main():
    # Path to your trained weights
    model_path = "/runs/detect/blood_cell_detector/weights/best.pt"

    # Path to your test images
    test_images = "/Users/natbailie/Documents/Blood Cell Identifier Project/Datasets/TXL-PBC_Dataset-master/TXL-PBC/images/test"

    # Load trained model
    model = YOLO(model_path)

    # Run predictions
    results = model.predict(
        source=test_images,                # folder or single image
        save=True,                         # save annotated images
        save_txt=False,                    # set True if you want YOLO labels saved
        conf=0.25,                         # confidence threshold
        project="runs/detect",             # where to save results
        name="predict_blood_cells",        # subfolder for this run
        exist_ok=True                      # overwrite if folder exists
    )

    print("\n✅ Predictions complete. Results saved in: runs/detect/predict_blood_cells/")

if __name__ == "__main__":
    main()