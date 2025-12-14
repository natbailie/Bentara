from PyQt6.QtWidgets import QWidget, QVBoxLayout, QLabel, QPushButton, QFileDialog, QMessageBox
import os

class SettingsWindow(QWidget):
    def __init__(self):
        super().__init__()
        self.setLayout(QVBoxLayout())
        self._build_ui()

    def _build_ui(self):
        self.layout().addWidget(QLabel("Settings"))
        self.change_models_btn = QPushButton("Change Models Folder")
        self.layout().addWidget(self.change_models_btn)
        self.change_models_btn.clicked.connect(self.change_models_folder)

    def change_models_folder(self):
        path = QFileDialog.getExistingDirectory(self, "Select models folder")
        if path:
            # save to a small config file in project
            cfg = os.path.join(os.path.dirname(__file__), "config_models.txt")
            with open(cfg, "w") as f:
                f.write(path)
            QMessageBox.information(self, "Saved", "Model folder updated. Restart app for changes to take effect.")