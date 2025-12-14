import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import sys
import os
import subprocess
from PyQt6.QtWidgets import (
    QApplication, QWidget, QLabel, QPushButton,
    QVBoxLayout, QFileDialog, QMessageBox, QLineEdit
)
from PyQt6.QtGui import QPixmap
from PyQt6.QtCore import Qt
from fpdf import FPDF

# ------------------------------------------------------
# Configuration
# ------------------------------------------------------
MODEL_PATHS = {
    "Neutrophil": "runs/detect/Neutrophil_detector/weights/best.pt",
    "Lymphocyte": "runs/detect/Lymphocyte_detector/weights/best.pt",
    "Monocyte": "runs/detect/Monocyte_detector/weights/best.pt",
    "Eosinophil": "runs/detect/Eosinophil_detector/weights/best.pt",
    "BloodCells": "runs/detect/BloodCells_detector/weights/best.pt",
}

OUTPUT_DIR = os.path.join(os.getcwd(), "outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)


# ------------------------------------------------------
# Helper functions
# ------------------------------------------------------
def model_exists(model_path):
    """Check if a model file exists"""
    return os.path.exists(model_path)


def run_yolo_inference(model_path, image_path, output_dir):
    """Run YOLO inference using subprocess"""
    if not model_exists(model_path):
        return False, f"❌ Model not found: {model_path}"

    try:
        subprocess.run([
            "yolo", "predict",
            "--model", model_path,
            "--source", image_path,
            "--save", "--project", output_dir,
            "--name", "inference_results", "--exist-ok"
        ], check=True)
        return True, "✅ Inference completed successfully."
    except subprocess.CalledProcessError as e:
        return False, f"⚠️ YOLO inference failed: {e}"


def generate_pdf_report(results_text, output_dir):
    """Generate a simple PDF summary"""
    pdf_path = os.path.join(output_dir, "Analysis_Summary.pdf")
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", size=12)
    pdf.cell(200, 10, txt="Blood Film Analysis Summary", ln=True, align="C")
    pdf.ln(10)
    pdf.multi_cell(0, 10, results_text)
    pdf.output(pdf_path)
    return pdf_path


# ------------------------------------------------------
# Main Application Window
# ------------------------------------------------------
class BloodApp(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Haematology AI - Beta Version")
        self.setGeometry(200, 200, 600, 500)
        self.image_path = None

        self.init_ui()

    def init_ui(self):
        layout = QVBoxLayout()

        # Title
        title = QLabel("Haematology Blood Film AI")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        title.setStyleSheet("font-size: 24px; font-weight: bold;")

        # Logo
        logo_label = QLabel()
        logo_path = os.path.join(os.getcwd(), "logo.png")
        if os.path.exists(logo_path):
            pixmap = QPixmap(logo_path).scaled(150, 150, Qt.AspectRatioMode.KeepAspectRatio)
            logo_label.setPixmap(pixmap)
            logo_label.setAlignment(Qt.AlignmentFlag.AlignCenter)

        # Upload button
        upload_btn = QPushButton("Upload Blood Film Image")
        upload_btn.clicked.connect(self.upload_image)

        # Run button
        run_btn = QPushButton("Run Analysis")
        run_btn.clicked.connect(self.run_analysis)

        # Result label
        self.result_label = QLabel("Awaiting input...")
        self.result_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.result_label.setStyleSheet("font-size: 14px;")

        layout.addWidget(title)
        layout.addWidget(logo_label)
        layout.addWidget(upload_btn)
        layout.addWidget(run_btn)
        layout.addWidget(self.result_label)

        self.setLayout(layout)

    def upload_image(self):
        file_path, _ = QFileDialog.getOpenFileName(self, "Select Image", "", "Images (*.jpg *.jpeg *.png)")
        if file_path:
            self.image_path = file_path
            self.result_label.setText(f"✅ Loaded: {os.path.basename(file_path)}")

    def run_analysis(self):
        if not self.image_path:
            QMessageBox.warning(self, "No Image", "Please upload an image first.")
            return

        results_text = ""
        for cell_type, model_path in MODEL_PATHS.items():
            success, message = run_yolo_inference(model_path, self.image_path, OUTPUT_DIR)
            results_text += f"{cell_type}: {message}\n"

        # Save summary as PDF
        pdf_path = generate_pdf_report(results_text, OUTPUT_DIR)

        self.result_label.setText("✅ Analysis Complete!\nSummary saved as PDF.")
        QMessageBox.information(self, "Analysis Complete", f"Results saved to:\n{pdf_path}")


# ------------------------------------------------------
# App Entry Point
# ------------------------------------------------------
if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = BloodApp()
    window.show()
    sys.exit(app.exec())