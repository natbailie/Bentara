import os
import sys
import json
import subprocess
from PyQt6.QtWidgets import (
    QWidget, QLabel, QPushButton, QVBoxLayout, QHBoxLayout, QListWidget,
    QListWidgetItem, QLineEdit, QComboBox, QSizePolicy, QMessageBox, QTextEdit
)
from PyQt6.QtGui import QPixmap, QFont
from PyQt6.QtCore import Qt


class DashboardWindow(QWidget):
    def __init__(self, parent_login=None, logged_in_user="admin"):
        super().__init__()
        self.parent_login = parent_login
        self.logged_in_user = logged_in_user
        self.analysis_window = None

        self.setWindowTitle("Bentara Pathology - Dashboard")
        self.setMinimumSize(1200, 800)

        self._build_ui()
        self.load_patient_history()

    def _build_ui(self):
        root_layout = QHBoxLayout()
        root_layout.setContentsMargins(0, 0, 0, 0)

        # ---------------- Sidebar ----------------
        sidebar_layout = QVBoxLayout()
        sidebar_layout.setContentsMargins(12, 12, 12, 12)
        sidebar_layout.setSpacing(12)

        self.logo_label = QLabel()
        logo_path = os.path.join(os.path.dirname(__file__), "../resources/logo.png")
        if os.path.exists(logo_path):
            self.logo_label.setPixmap(QPixmap(logo_path).scaled(120, 120, Qt.AspectRatioMode.KeepAspectRatio))
        else:
            self.logo_label.setText("Bentara Pathology")
            self.logo_label.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        self.logo_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        sidebar_layout.addWidget(self.logo_label)

        self.run_btn = QPushButton("🔬 Run Analysis")
        self.history_btn = QPushButton("📊 Patient History")
        self.logout_btn = QPushButton("🚪 Logout")
        for b in (self.run_btn, self.history_btn, self.logout_btn):
            b.setFixedHeight(44)
            b.setStyleSheet("color:black;")
            sidebar_layout.addWidget(b)

        sidebar_layout.addStretch(1)

        # ---------------- Center (History List) ----------------
        center_layout = QVBoxLayout()
        center_layout.setContentsMargins(8, 8, 8, 8)
        center_layout.setSpacing(8)

        # Search/filter controls
        filter_row = QHBoxLayout()
        self.filter_type = QComboBox()
        self.filter_type.addItems(["All Fields", "Patient ID", "Technician", "Date"])
        self.search_field = QLineEdit()
        self.search_field.setPlaceholderText("Search patient ID, technician or date...")
        self.search_btn = QPushButton("Search")
        self.reset_btn = QPushButton("Reset")
        for w in [self.search_field, self.search_btn, self.reset_btn]:
            w.setStyleSheet("color:black;")
        self.search_btn.setFixedHeight(32)
        self.reset_btn.setFixedHeight(32)
        filter_row.addWidget(self.filter_type)
        filter_row.addWidget(self.search_field)
        filter_row.addWidget(self.search_btn)
        filter_row.addWidget(self.reset_btn)
        center_layout.addLayout(filter_row)

        # History list
        self.history_list = QListWidget()
        self.history_list.setStyleSheet("color:black;")
        self.history_list.setSelectionMode(QListWidget.SelectionMode.SingleSelection)
        center_layout.addWidget(self.history_list)

        # Open buttons
        open_row = QHBoxLayout()
        self.open_pdf_btn = QPushButton("📄 Open PDF")
        self.open_folder_btn = QPushButton("📂 Open Folder")
        self.open_image_btn = QPushButton("🖼️ Open Annotated Image")
        for b in (self.open_pdf_btn, self.open_folder_btn, self.open_image_btn):
            b.setFixedHeight(36)
            b.setStyleSheet("color:black;")
            open_row.addWidget(b)
        center_layout.addLayout(open_row)

        # ---------------- Right (Summary Panel) ----------------
        self.summary_text = QTextEdit()
        self.summary_text.setReadOnly(True)
        self.summary_text.setStyleSheet("color:black; background:white;")
        self.summary_text.setMinimumWidth(380)
        self.summary_text.setText("No report selected.")

        # ---------------- Assemble Layouts ----------------
        root_layout.addLayout(sidebar_layout, 1)
        root_layout.addLayout(center_layout, 2)
        root_layout.addWidget(self.summary_text, 1)

        self.setLayout(root_layout)

        # ---------------- Connections ----------------
        self.run_btn.clicked.connect(self.open_analysis)
        self.history_btn.clicked.connect(self.show_history)
        self.logout_btn.clicked.connect(self.logout)
        self.search_btn.clicked.connect(self.search_history)
        self.reset_btn.clicked.connect(self.load_patient_history)
        self.history_list.itemClicked.connect(self.on_report_selected)
        self.open_pdf_btn.clicked.connect(self.open_selected_pdf)
        self.open_folder_btn.clicked.connect(self.open_selected_folder)
        self.open_image_btn.clicked.connect(self.open_selected_image)

        # Initially hide history controls
        self.history_list.hide()
        self.open_pdf_btn.hide()
        self.open_folder_btn.hide()
        self.open_image_btn.hide()

    # ---------------- Load patient history ----------------
    def load_patient_history(self):
        self.history_list.clear()
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
        reports_root = os.path.join(base_dir, "Application/outputs/reports")
        if not os.path.exists(reports_root):
            return
        for patient_folder in sorted(os.listdir(reports_root), reverse=True):
            pdir = os.path.join(reports_root, patient_folder)
            if not os.path.isdir(pdir):
                continue
            for fname in sorted(os.listdir(pdir), reverse=True):
                if not fname.lower().endswith(".json"):
                    continue
                json_path = os.path.join(pdir, fname)
                try:
                    with open(json_path, "r", encoding="utf-8") as jf:
                        meta = json.load(jf)
                except:
                    continue
                patient_id = meta.get("patient_id", patient_folder.replace("Patient_", ""))
                analyst = meta.get("analyst", "Unknown")
                timestamp = meta.get("timestamp", "Unknown")
                pdf_path = meta.get("pdf_path", "")
                display = f"Patient: {patient_id} | Technician: {analyst} | Date: {timestamp}"
                item = QListWidgetItem(display)
                item.setData(Qt.ItemDataRole.UserRole, json_path)
                item.setData(Qt.ItemDataRole.UserRole + 1, pdf_path)
                self.history_list.addItem(item)

        # Show history controls
        self.history_list.show()
        self.open_pdf_btn.show()
        self.open_folder_btn.show()
        self.open_image_btn.show()

    # ---------------- Search functionality ----------------
    def search_history(self):
        q = self.search_field.text().strip().lower()
        if not q:
            QMessageBox.information(self, "Search", "Please enter a search term.")
            return
        ftype = self.filter_type.currentText()
        for i in range(self.history_list.count()):
            item = self.history_list.item(i)
            txt = item.text().lower()
            visible = False
            if ftype == "All Fields":
                visible = q in txt
            elif ftype == "Patient ID":
                visible = "patient:" in txt and q in txt.split("patient:")[1]
            elif ftype == "Technician":
                visible = "technician:" in txt and q in txt.split("technician:")[1]
            elif ftype == "Date":
                visible = "date:" in txt and q in txt.split("date:")[1]
            item.setHidden(not visible)

    # ---------------- Report selection ----------------
    def on_report_selected(self, item):
        json_path = item.data(Qt.ItemDataRole.UserRole)
        if not json_path or not os.path.exists(json_path):
            self.summary_text.setText("Metadata file unavailable.")
            return
        try:
            with open(json_path, "r", encoding="utf-8") as jf:
                meta = json.load(jf)
        except Exception as e:
            self.summary_text.setText(f"Error reading metadata: {e}")
            return

        patient_id = meta.get("patient_id", "Unknown")
        analyst = meta.get("analyst", "Unknown")
        timestamp = meta.get("timestamp", "Unknown")
        img_type = meta.get("image_type", "Unknown")
        stain = meta.get("stain_used", "Unknown")
        zoom = meta.get("zoom_used", "Unknown")
        counts = meta.get("cell_counts", {})
        total = meta.get("total_cells", sum(counts.values()) if counts else 0)
        pdf_path = meta.get("pdf_path", "")

        lines = [
            f"Patient ID: {patient_id}",
            f"Clinician: {analyst}",
            f"Timestamp: {timestamp}",
            f"Image Type: {img_type}",
            f"Stain: {stain}",
            f"Magnification: {zoom}",
            f"Total cells: {total}",
            "Counts:"
        ]
        for k, v in counts.items():
            lines.append(f"  • {k}: {v}")
        lines.append("")
        lines.append(f"PDF: {pdf_path if pdf_path else 'Not available'}")
        lines.append("")
        lines.append("Disclaimer: Bentara Pathology is an AI-assisted tool. Results must be reviewed by a qualified clinician.")
        self.summary_text.setText("\n".join(lines))

    # ---------------- Open actions ----------------
    def open_selected_pdf(self):
        item = self.history_list.currentItem()
        if not item:
            QMessageBox.warning(self, "No selection", "Please select a report first.")
            return
        pdf_path = item.data(Qt.ItemDataRole.UserRole + 1)
        if not pdf_path or not os.path.exists(pdf_path):
            QMessageBox.critical(self, "Missing", "PDF not found.")
            return
        try:
            if sys.platform == "darwin":
                subprocess.call(["open", pdf_path])
            elif sys.platform == "win32":
                os.startfile(pdf_path)
            else:
                subprocess.call(["xdg-open", pdf_path])
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Could not open PDF: {e}")

    def open_selected_folder(self):
        item = self.history_list.currentItem()
        if not item:
            QMessageBox.warning(self, "No selection", "Please select a report first.")
            return
        pdf_path = item.data(Qt.ItemDataRole.UserRole + 1)
        if not pdf_path or not os.path.exists(pdf_path):
            QMessageBox.critical(self, "Missing", "PDF not found; cannot open folder.")
            return
        folder = os.path.dirname(pdf_path)
        try:
            if sys.platform == "darwin":
                subprocess.call(["open", folder])
            elif sys.platform == "win32":
                os.startfile(folder)
            else:
                subprocess.call(["xdg-open", folder])
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Could not open folder: {e}")

    def open_selected_image(self):
        item = self.history_list.currentItem()
        if not item:
            QMessageBox.warning(self, "No selection", "Please select a report first.")
            return
        annotated_path = os.path.splitext(item.data(Qt.ItemDataRole.UserRole + 1))[0] + "_annotated.jpg"
        if not os.path.exists(annotated_path):
            QMessageBox.critical(self, "Missing", "Annotated image not available.")
            return
        from PyQt6.QtWidgets import QDialog, QVBoxLayout, QDialogButtonBox
        dlg = QDialog(self)
        dlg.setWindowTitle("Annotated Image")
        layout = QVBoxLayout()
        lbl = QLabel()
        pix = QPixmap(annotated_path).scaled(800, 600, Qt.AspectRatioMode.KeepAspectRatio)
        lbl.setPixmap(pix)
        layout.addWidget(lbl)
        buttons = QDialogButtonBox(QDialogButtonBox.StandardButton.Close)
        buttons.rejected.connect(dlg.reject)
        layout.addWidget(buttons)
        dlg.setLayout(layout)
        dlg.exec()

    # ---------------- Navigation ----------------
    def show_history(self):
        self.history_list.show()
        self.open_pdf_btn.show()
        self.open_folder_btn.show()
        self.open_image_btn.show()
        self.load_patient_history()

    def open_analysis(self):
        from scripts.analyse_window import AnalysisWindow
        self.analysis_window = AnalysisWindow(parent_dashboard=self, logged_in_user=self.logged_in_user)
        self.analysis_window.show()
        self.hide()

    def logout(self):
        confirm = QMessageBox.question(self, "Confirm logout", "Log out and return to login screen?", QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No)
        if confirm == QMessageBox.StandardButton.Yes:
            if self.parent_login:
                self.parent_login.username.clear()
                self.parent_login.password.clear()
                self.parent_login.show()
            self.close()