# Use a lightweight Python base image
FROM python:3.11-slim

# Install system dependencies needed for OpenCV (required by YOLO/Ultralytics)
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
            && rm -rf /var/lib/apt/lists/*

# Create a non-root user (mandatory for Hugging Face Spaces security)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# Install Python requirements
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
                                         pip install --no-cache-dir -r requirements.txt

# Copy the models folder and main.py script
COPY --chown=user . .

# Expose port 7860 (Spaces mandatory port)
EXPOSE 7860

# Start the application using Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]