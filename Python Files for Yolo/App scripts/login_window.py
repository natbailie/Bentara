import sys, os
from PyQt6.QtWidgets import (
    QWidget, QLabel, QVBoxLayout, QLineEdit, QPushButton, QApplication, QMessageBox
)
from PyQt6.QtGui import QPixmap, QFont
from PyQt6.QtCore import Qt


class LoginWindow(QWidget):
    def __init__(self, on_login_success=None):
        super().__init__()
        self.on_login_success = on_login_success
        self.setWindowTitle("Bentara Pathology – Secure Login")
        self.setMinimumSize(600, 700)
        self.setStyleSheet("""
            QWidget {
                background-color: #F9FBFD;
                font-family: 'Segoe UI';
                font-size: 13px;
            }
            QLineEdit {
                padding: 10px;
                border: 1px solid #C2C7D0;
                border-radius: 8px;
                background: #FFFFFF;
            }
            QPushButton {
                background-color: #007C89;
                color: white;
                border-radius: 8px;
                padding: 10px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #0099A5;
            }
        """)

        self._build_ui()

    def _build_ui(self):
        layout = QVBoxLayout()
        layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.setSpacing(20)

        logo_label = QLabel()
        logo_path = os.path.join(os.path.dirname(__file__), "../resources/logo.png")
        if os.path.exists(logo_path):
            pixmap = QPixmap(logo_path).scaled(260, 260, Qt.AspectRatioMode.KeepAspectRatio,
                                               Qt.TransformationMode.SmoothTransformation)
            logo_label.setPixmap(pixmap)
        else:
            logo_label.setText("Bentara Pathology")
            logo_label.setFont(QFont("Segoe UI", 20, QFont.Weight.Bold))
        logo_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(logo_label)

        title = QLabel("Clinical Diagnostic Platform")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        title.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        title.setStyleSheet("color: #007C89;")
        layout.addWidget(title)

        self.username = QLineEdit()
        self.username.setPlaceholderText("Username")
        layout.addWidget(self.username)

        self.password = QLineEdit()
        self.password.setPlaceholderText("Password")
        self.password.setEchoMode(QLineEdit.EchoMode.Password)
        layout.addWidget(self.password)

        self.login_button = QPushButton("Login")
        layout.addWidget(self.login_button)

        self.login_button.clicked.connect(self.handle_login)
        self.password.returnPressed.connect(self.handle_login)
        self.username.returnPressed.connect(self.handle_login)

        self.setLayout(layout)

    def handle_login(self):
        user = self.username.text().strip()
        pwd = self.password.text().strip()

        if user == "" or pwd == "":
            QMessageBox.warning(self, "Missing Information", "Please enter both username and password.")
            return

        # placeholder for authentication logic
        if user.lower() == "admin" and pwd == "password":
            QMessageBox.information(self, "Welcome", "Login successful.")
            if self.on_login_success:
                self.on_login_success(logged_in_user=user)
        else:
            QMessageBox.critical(self, "Access Denied", "Invalid credentials. Please try again.")