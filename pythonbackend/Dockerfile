# Use an official Python runtime as a parent image
FROM python:3.9

# Set the working directory in the container
WORKDIR /code

# Copy the requirements file into the container
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Ensure the models directory exists and is copied
# Your main.py expects models in /code/models/
COPY ./models ./models

# Create a directory for uploads in /tmp for write permissions
RUN mkdir -p /tmp/uploads /tmp/dataset/images /tmp/dataset/labels && chmod 777 /tmp/uploads

# Expose the port Hugging Face Spaces expects
EXPOSE 7860

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
