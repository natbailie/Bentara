import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from PyQt6.QtWidgets import QWidget, QVBoxLayout, QPushButton, QLabel, QFileDialog, QTextEdit
from PyQt6.QtGui import QPixmap
from detector import CellDetector
from pdf_report import generate_pdf_report
import os
import cv2

BASE_PATH = os.path.abspath(os.path.dirname(__file__))

class MainWindow(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Blood Cell Identifier – Main")
        self.setFixedSize(800, 600)

        self.layout = QVBoxLayout()
        self.setLayout(self.layout)

        self.image_label = QLabel("Upload an image to start")
        self.image_label.setFixedSize(500, 500)
        self.layout.addWidget(self.image_label)

        self.result_text = QTextEdit()
        self.result_text.setReadOnly(True)
        self.layout.addWidget(self.result_text)

        self.upload_button = QPushButton("Upload Image")
        self.upload_button.clicked.connect(self.load_image)
        self.layout.addWidget(self.upload_button)

        self.detect_button = QPushButton("Detect Cells")
        self.detect_button.clicked.connect(self.detect_cells)
        self.layout.addWidget(self.detect_button)

        # Initialize detector
        self.detector = CellDetector()  # uses detector.py logic
        self.current_image_path = None

    def load_image(self):
        file_path, _ = QFileDialog.getOpenFileName(self, "Select Image", "", "Images (*.png *.jpg *.jpeg)")
        if file_path:
            self.current_image_path = file_path
            pixmap = QPixmap(file_path)
            self.image_label.setPixmap(pixmap.scaled(self.image_label.width(), self.image_label.height()))
            self.result_text.setText(f"Loaded image: {os.path.basename(file_path)}")

    def detect_cells(self):
        if not self.current_image_path:
            self.result_text.setText("Please upload an image first!")
            return

        image = cv2.imread(self.current_image_path)
        counts, annotated = self.detector.run_detection(image)

        # Save annotated image
        cv2.imwrite("../annotated.jpg", annotated)
        self.image_label.setPixmap(QPixmap("../annotated.jpg").scaled(self.image_label.width(), self.image_label.height()))

        # Generate PDF
        pdf_path = generate_pdf_report(counts, os.path.basename(self.current_image_path))
        result_str = "\n".join([f"{k}: {v}" for k, v in counts.items()])
        self.result_text.setText(f"Detection complete!\n\n{result_str}\n\nPDF report: {pdf_path}")