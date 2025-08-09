# Use Python 3.10
FROM python:3.10-slim

# Set working directory
WORKDIR /app
# Copy backend code into container
COPY ./backend /app

# Upgrade pip and install requirements
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Download spaCy model
RUN python -m spacy download en_core_web_sm
# Expose the port used by Uvicorn
EXPOSE 10000

# Run the FastAPI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "${PORT}"]
