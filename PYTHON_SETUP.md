# Python Dependencies Setup

This project uses Python for ML-based recommendation system. Follow these steps to set up the Python environment:

## Prerequisites
- Python 3.8 or higher
- pip (Python package installer)

## Installation Steps

### 1. Install Python Dependencies
```bash
# Navigate to the backend directory
cd Demo_Project_Backend

# Install Python dependencies
pip install -r requirements.txt
```

### 2. Alternative Installation (if pip3 is available)
```bash
pip3 install -r requirements.txt
```

### 3. For Linux/Mac users
```bash
# Make the installation script executable
chmod +x install_python_deps.sh

# Run the installation script
./install_python_deps.sh
```

## Required Python Packages
- pandas==2.0.3
- numpy==1.24.3
- scikit-learn==1.3.0
- pymongo==4.5.0
- python-dotenv==1.0.0

## Troubleshooting

### If you get "ModuleNotFoundError"
1. Ensure Python is installed and accessible via command line
2. Install the required packages using pip
3. Check if you're using the correct Python version

### For Render Deployment
The application includes fallback mechanisms when Python dependencies are not available. The recommendation system will return empty arrays with appropriate warnings.

### Manual Installation
If automatic installation fails, install packages individually:
```bash
pip install pandas==2.0.3
pip install numpy==1.24.3
pip install scikit-learn==1.3.0
pip install pymongo==4.5.0
pip install python-dotenv==1.0.0
```

## Testing
After installation, you can test the Python setup using:
```bash
# Test endpoint
GET /api/recommendations/test
```

This will verify if Python is working correctly with the required dependencies.