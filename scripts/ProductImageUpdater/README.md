# Product Image Updater Script - Setup Guide

This Python script queries your SQL Server database for products without images, calls your Image Finder API to generate images, and updates the database with the returned image URLs.

## Prerequisites

1. Python 3.7 or higher
2. SQL Server ODBC Driver installed
3. Your Image Finder API running (Node.js service)

## Setup Instructions

### 1. Install Required Packages

```bash
pip install -r requirements.txt
```

### 2. Configure ODBC Driver

Make sure you have the Microsoft ODBC Driver for SQL Server installed:

- **Windows**: [Download from Microsoft](https://docs.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server)
- **Linux/macOS**: Follow [Microsoft's installation guide](https://docs.microsoft.com/en-us/sql/connect/odbc/linux-mac/installing-the-microsoft-odbc-driver-for-sql-server)

The script is configured to use "ODBC Driver 17 for SQL Server". If you have a different version, update the connection string in the script.

### 3. Configure Environment Variables

Create a `.env` file with your database and API settings:

```ini
# Database Configuration
DB_SERVER=your_sql_server_hostname
DB_NAME=your_database_name
DB_USER=your_database_username
DB_PASSWORD=your_database_password

# API Configuration
API_BASE_URL=http://localhost:3000
API_KEY=c8b2a9f6-e1d5-4b7f-9e3c-d7a2f6b4e512

# Processing Options
BATCH_SIZE=10
SLEEP_BETWEEN_CALLS=1.0
MAX_RETRIES=3
RETRY_DELAY=2.0
DRY_RUN=False
```

## Running the Script

### Basic Usage

```bash
python product_image_updater.py
```

This will process all products without images in batches of 10.

### Command Line Options

You can override the configuration with command line arguments:

```bash
# Process one specific product
python product_image_updater.py --product-id 12345

# Run without making actual database updates
python product_image_updater.py --dry-run

# Specify database credentials
python product_image_updater.py --db-server myserver --db-name mydb --db-user myuser --db-password mypassword

# Control batch size and processing speed
python product_image_updater.py --batch-size 20 --sleep 0.5
```

## Troubleshooting

### ODBC Driver Issues

If you get `Error: [Microsoft][ODBC Driver Manager] Data source name not found and no default driver specified`:

1. Check if your ODBC driver is installed
2. Update the DRIVER value in the connection string if you have a different version

### API Connection Issues

If you can't connect to the API:

1. Make sure your Image Finder API is running
2. Check the API_BASE_URL in your .env file
3. Verify that the API_KEY matches what's in your API's .env file

### Database Permission Issues

If you get permission errors:

1. Make sure your database user has SELECT permissions on the Product, ProductType, and ProductLine tables
2. Make sure your database user has UPDATE permissions on the Product table

## Logging

The script creates a log file `image_updater.log` with detailed information about the process. Check this file if you're encountering any issues.