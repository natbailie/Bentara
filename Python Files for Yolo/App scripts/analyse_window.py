import os
import sys
import cv2
import subprocess
import json
from datetime import datetime
from PyQt6.QtWidgets import (
    QWidget, QLabel, QVBoxLayout, QHBoxLayout, QPushButton,
    QLineEdit, QComboBox, QProgressBar, QSizePolicy, QMessageBox
)
from PyQt6.QtGui import QPixmap, QFont
from PyQt6.QtCore import Qt
from ultralytics import YOLO
from fpdf import FPDF


class AnalysisWindow(QWidget):
    def __init__(self, parent_dashboard=None, logged_in_user="admin"):
        super().__init__()
        self.parent_dashboard = parent_dashboard
        self.logged_in_user = logged_in_user
        self.setWindowTitle("Bentara Pathology — Blood Cell Analysis")
        self.setMinimumSize(1200, 800)
        self.image_path = None
        self.models = {}
        self.loaded = False

        self.init_ui()
        self.load_models()

    def init_ui(self):
        main_layout = QHBoxLayout()
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)

        # ---------------- Sidebar ----------------
        sidebar_layout = QVBoxLayout()
        sidebar_layout.setAlignment(Qt.AlignmentFlag.AlignTop)
        sidebar_layout.setSpacing(15)
        sidebar_layout.setContentsMargins(10, 10, 10, 10)

        # Mandatory fields
        self.patient_id = QLineEdit()
        self.patient_id.setPlaceholderText("Patient Healthcare Number")
        self.patient_id.setStyleSheet("padding:8px; color:black; border:2px solid #C2C7D0; border-radius:6px;")
        sidebar_layout.addWidget(self.patient_id)

        self.image_type = QComboBox()
        self.image_type.addItems(["Select Image Type", "Peripheral Blood Film", "Bone Marrow Film"])
        sidebar_layout.addWidget(self.image_type)

        self.stain_used = QComboBox()
        self.stain_used.addItems(["Select Stain", "Wright-Giemsa", "May-Grünwald Giemsa", "Leishman"])
        sidebar_layout.addWidget(self.stain_used)

        self.zoom_used = QComboBox()
        self.zoom_used.addItems(["Select Magnification", "x10", "x20", "x40", "x100"])
        sidebar_layout.addWidget(self.zoom_used)

        # Buttons
        self.back_btn = QPushButton("← Back to Dashboard")
        self.upload_btn = QPushButton("📁 Upload Image")
        self.run_btn = QPushButton("🔍 Run Analysis")
        self.run_btn.setEnabled(False)

        for btn in [self.back_btn, self.upload_btn, self.run_btn]:
            btn.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
            sidebar_layout.addWidget(btn)

        # Enable run button only if all mandatory fields are filled
        for widget in [self.patient_id, self.image_type, self.stain_used, self.zoom_used]:
            if isinstance(widget, QLineEdit):
                widget.textChanged.connect(self.check_fields)
            else:
                widget.currentIndexChanged.connect(self.check_fields)

        self.back_btn.clicked.connect(self.go_back)
        self.upload_btn.clicked.connect(self.load_image)
        self.run_btn.clicked.connect(self.run_analysis)
        sidebar_layout.addStretch()

        # ---------------- Main Content ----------------
        content_layout = QVBoxLayout()
        content_layout.setSpacing(20)
        content_layout.setContentsMargins(30, 30, 30, 30)

        self.logo_label = QLabel()
        logo_path = os.path.join(os.path.dirname(__file__), "../resources/logo.png")
        if os.path.exists(logo_path):
            pixmap = QPixmap(logo_path)
            self.logo_label.setPixmap(pixmap.scaled(120, 120, Qt.AspectRatioMode.KeepAspectRatio))
        content_layout.addWidget(self.logo_label, alignment=Qt.AlignmentFlag.AlignCenter)

        self.image_label = QLabel()
        self.image_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.image_label.setStyleSheet("border:2px dashed #C2C7D0; background-color:white; color:black;")
        self.image_label.setFixedSize(400, 400)
        content_layout.addWidget(self.image_label)

        self.progress = QProgressBar()
        content_layout.addWidget(self.progress)
        self.status_label = QLabel("Ready to analyze.")
        self.status_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.status_label.setStyleSheet("color:black;")
        content_layout.addWidget(self.status_label)

        main_layout.addLayout(sidebar_layout, 1)
        main_layout.addLayout(content_layout, 4)
        self.setLayout(main_layout)

    def check_fields(self):
        patient_filled = bool(self.patient_id.text().strip())
        type_selected = self.image_type.currentIndex() != 0
        stain_selected = self.stain_used.currentIndex() != 0
        zoom_selected = self.zoom_used.currentIndex() != 0
        self.run_btn.setEnabled(patient_filled and type_selected and stain_selected and zoom_selected)

    def load_models(self):
        base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
        model_names = ["Neutrophil", "Lymphocyte", "Monocyte", "Eosinophil", "BloodCells"]
        self.models = {}
        for name in model_names:
            path = os.path.join(base_path, f"runs/detect/{name}_detector/weights/best.pt")
            if os.path.exists(path):
                self.models[name] = YOLO(path)
                print(f"Loaded model: {name} from {path}")
            else:
                print(f"Missing model: {name}")
        self.loaded = bool(self.models)

    def load_image(self):
        from PyQt6.QtWidgets import QFileDialog
        path, _ = QFileDialog.getOpenFileName(self, "Select Blood Film Image", "", "Images (*.png *.jpg *.jpeg)")
        if path:
            self.image_path = path
            pix = QPixmap(path).scaled(self.image_label.size(), Qt.AspectRatioMode.KeepAspectRatio)
            self.image_label.setPixmap(pix)

    def go_back(self):
        if self.parent_dashboard:
            self.parent_dashboard.show()
            self.close()

    def run_analysis(self):
        if not self.image_path:
            QMessageBox.warning(self, "No Image", "Please upload an image first.")
            return
        if not self.loaded:
            QMessageBox.critical(self, "No Models", "No trained models found.")
            return

        patient_id = self.patient_id.text().strip()
        img_type = self.image_type.currentText()
        stain = self.stain_used.currentText()
        zoom = self.zoom_used.currentText()

        if img_type.startswith("Select") or stain.startswith("Select") or zoom.startswith("Select"):
            QMessageBox.warning(self, "Incomplete Fields", "Please fill in all mandatory fields.")
            return

        image = cv2.imread(self.image_path)
        if image is None:
            QMessageBox.critical(self, "Error", "Could not read the image.")
            return

        combined_counts = {}
        self.progress.setValue(0)

        annotated_image = image.copy()
        step = max(1, int(100 / len(self.models)))

        for i, (name, model) in enumerate(self.models.items()):
            results = model(image)
            boxes = getattr(results[0], "boxes", [])
            for box in boxes:
                try:
                    cls = int(box.cls[0])
                    label = model.names[cls]
                except:
                    label = getattr(box, "label", "cell")
                combined_counts[label] = combined_counts.get(label, 0) + 1
            try:
                annotated_image = results[0].plot()
            except:
                pass
            from PyQt6.QtWidgets import QApplication
            self.progress.setValue(min(100, (i + 1) * step))
            QApplication.processEvents()

        # Save annotated image
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
        patient_dir = os.path.join(base_dir, "Application/outputs/reports", f"Patient_{patient_id}")
        os.makedirs(patient_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        annotated_path = os.path.join(patient_dir, f"annotated_{timestamp}.jpg")
        cv2.imwrite(annotated_path, annotated_image)

        # Generate PDF + JSON
        pdf_path = os.path.join(patient_dir, f"report_{timestamp}.pdf")
        self.generate_pdf_report(pdf_path, patient_id, combined_counts, annotated_path, img_type, stain, zoom)

        QMessageBox.information(self, "Analysis Complete", f"Report saved:\n{pdf_path}")
        self.progress.setValue(100)

    def generate_pdf_report(self, pdf_path, pid, counts, annotated_path, img_type, stain, zoom):
        pdf = FPDF()
        pdf.add_page()
        font_path = os.path.join(os.path.dirname(__file__), "../resources/DejaVuSans.ttf")
        if os.path.exists(font_path):
            pdf.add_font("DejaVu", "", font_path, uni=True)
            pdf.set_font("DejaVu", "", 12)
        else:
            pdf.set_font("Helvetica", "", 12)

        # Header
        pdf.cell(0, 10, "Bentara Pathology - Blood Cell Analysis", ln=True, align="C")
        pdf.ln(8)

        # Patient & image info
        pdf.cell(0, 10, f"Patient ID: {pid}", ln=True)
        pdf.cell(0, 10, f"Clinician: {self.logged_in_user}", ln=True)
        pdf.cell(0, 10, f"Image Type: {img_type}", ln=True)
        pdf.cell(0, 10, f"Stain Used: {stain}", ln=True)
        pdf.cell(0, 10, f"Magnification: {zoom}", ln=True)
        pdf.ln(8)

        # Detected cells
        pdf.set_font("DejaVu", "B", 12) if os.path.exists(font_path) else pdf.set_font("Helvetica", "B", 12)
        pdf.cell(0, 10, "Detected Cell Counts:", ln=True)
        pdf.set_font("DejaVu", "", 12) if os.path.exists(font_path) else pdf.set_font("Helvetica", "", 12)
        total = sum(counts.values())
        for k, v in counts.items():
            pdf.cell(0, 10, f"  • {k}: {v}", ln=True)
        pdf.ln(4)
        pdf.cell(0, 10, f"Total Cells: {total}", ln=True)
        pdf.ln(8)

        # Diagnosis
        pdf.set_font("DejaVu", "B", 12) if os.path.exists(font_path) else pdf.set_font("Helvetica", "B", 12)
        pdf.cell(0, 10, "Diagnosis: Normal (Demo)", ln=True)
        pdf.ln(8)

        # Disclaimer
        pdf.set_font("DejaVu", "I", 10) if os.path.exists(font_path) else pdf.set_font("Helvetica", "I", 10)
        pdf.multi_cell(0, 8, "Disclaimer: Bentara Pathology is an AI-assisted tool. Results must be reviewed by a qualified clinician.")

        # Save PDF
        pdf.output(pdf_path)

        # Save JSON metadata
        json_path = os.path.splitext(pdf_path)[0] + ".json"
        meta = {
            "patient_id": pid,
            "analyst": self.logged_in_user,
            "image_type": img_type,
            "stain_used": stain,
            "zoom_used": zoom,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "cell_counts": counts,
            "total_cells": total,
            "diagnosis": "Normal (Demo)",
            "pdf_path": pdf_path,
            "annotated_image_path": annotated_path
        }
        with open(json_path, "w", encoding="utf-8") as jf:
            json.dump(meta, jf, indent=4)

        return pdf_path, json_path