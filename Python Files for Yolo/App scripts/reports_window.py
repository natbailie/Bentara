import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import os
import glob
from PyQt6.QtWidgets import QWidget, QVBoxLayout, QListWidget, QPushButton, QHBoxLayout, QMessageBox

class ReportsWindow(QWidget):
    def __init__(self):
        super().__init__()
        self.setLayout(QVBoxLayout())
        self._build_ui()

    def _build_ui(self):
        self.listw = QListWidget()
        self.refresh_btn = QPushButton("Refresh")
        self.open_btn = QPushButton("Open Report")
        self.delete_btn = QPushButton("Delete Report")

        h = QHBoxLayout()
        h.addWidget(self.open_btn)
        h.addWidget(self.delete_btn)

        self.layout().addWidget(self.listw)
        self.layout().addLayout(h)
        self.layout().addWidget(self.refresh_btn)

        self.refresh_btn.clicked.connect(self.refresh)
        self.open_btn.clicked.connect(self.open_report)
        self.delete_btn.clicked.connect(self.delete_report)

        self.refresh()

    def reports_dir(self):
        base = os.path.dirname(__file__)
        reports = os.path.join(base, "reports")
        if not os.path.exists(reports):
            os.makedirs(reports, exist_ok=True)
        return reports

    def refresh(self):
        self.listw.clear()
        pattern = os.path.join(self.reports_dir(), "*.pdf")
        for p in sorted(glob.glob(pattern), reverse=True):
            self.listw.addItem(p)

    def open_report(self):
        item = self.listw.currentItem()
        if not item:
            QMessageBox.information(self, "Select", "Please select a report first.")
            return
        path = item.text()
        try:
            if os.name == "nt":
                os.startfile(path)
            else:
                import subprocess
                subprocess.run(["open" if sys.platform == "darwin" else "xdg-open", path])
        except Exception as e:
            QMessageBox.warning(self, "Open Failed", str(e))

    def delete_report(self):
        item = self.listw.currentItem()
        if not item:
            return
        p = item.text()
        try:
            os.remove(p)
            self.refresh()
        except Exception as e:
            QMessageBox.warning(self, "Delete Failed", str(e))