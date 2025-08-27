#!/usr/bin/env python3
"""
Product Image Updater Script
----------------------------
This script queries a SQL Server database for products without images,
calls the Product Image API for each product, and updates the database
with the returned image URLs.
"""

import argparse
import json
import logging
import os
import sys
import time
from typing import Dict, List, Optional, Tuple

import pyodbc
import requests
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("logs/image_updater.log"),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# Default configuration (override with .env or command line args)
DEFAULT_CONFIG = {
    "DB_SERVER": os.getenv("DB_SERVER", "localhost"),
    "DB_NAME": os.getenv("DB_NAME", "YourDatabaseName"),
    "DB_USER": os.getenv("DB_USER", "YourUsername"),
    "DB_PASSWORD": os.getenv("DB_PASSWORD", "YourPassword"),
    "API_BASE_URL": os.getenv("API_BASE_URL", "http://localhost:3000"),
    "API_KEY": os.getenv("API_KEY", "c8b2a9f6-e1d5-4b7f-9e3c-d7a2f6b4e512"),
    "BATCH_SIZE": int(os.getenv("BATCH_SIZE", "10")),
    "SLEEP_BETWEEN_CALLS": float(os.getenv("SLEEP_BETWEEN_CALLS", "1.0")),
    "MAX_RETRIES": int(os.getenv("MAX_RETRIES", "3")),
    "RETRY_DELAY": float(os.getenv("RETRY_DELAY", "2.0")),
    "DRY_RUN": os.getenv("DRY_RUN", "False").lower() == "true",
}


def parse_arguments() -> Dict:
    """Parse command line arguments and merge with defaults."""
    parser = argparse.ArgumentParser(description="Update product images from API")

    parser.add_argument(
        "--db-server", dest="DB_SERVER", help="SQL Server hostname or IP"
    )
    parser.add_argument("--db-name", dest="DB_NAME", help="Database name")
    parser.add_argument("--db-user", dest="DB_USER", help="Database username")
    parser.add_argument("--db-password", dest="DB_PASSWORD", help="Database password")
    parser.add_argument(
        "--api-url", dest="API_BASE_URL", help="Base URL for the Product Image API"
    )
    parser.add_argument("--api-key", dest="API_KEY", help="API Key for authentication")
    parser.add_argument(
        "--batch-size",
        dest="BATCH_SIZE",
        type=int,
        help="Number of products to process in each batch",
    )
    parser.add_argument(
        "--sleep",
        dest="SLEEP_BETWEEN_CALLS",
        type=float,
        help="Seconds to sleep between API calls",
    )
    parser.add_argument(
        "--dry-run",
        dest="DRY_RUN",
        action="store_true",
        help="Run without making updates to the database",
    )
    parser.add_argument(
        "--product-id",
        dest="PRODUCT_ID",
        type=int,
        help="Process only a specific product ID",
    )

    args = parser.parse_args()

    # Merge command line args with defaults
    config = DEFAULT_CONFIG.copy()
    for key, value in vars(args).items():
        if value is not None:
            config[key] = value

    return config


def connect_to_database(config: Dict) -> pyodbc.Connection:
    """Establish connection to SQL Server database."""
    try:
        conn_string = (
            f"DRIVER={{ODBC Driver 17 for SQL Server}};"
            f"SERVER={config['DB_SERVER']};"
            f"DATABASE={config['DB_NAME']};"
            f"UID={config['DB_USER']};"
            f"PWD={config['DB_PASSWORD']};"
        )
        conn = pyodbc.connect(conn_string)
        logger.info(
            f"Successfully connected to database {config['DB_NAME']} on {config['DB_SERVER']}"
        )
        return conn
    except pyodbc.Error as e:
        logger.error(f"Database connection error: {e}")
        raise


def fetch_products_without_images(
    conn: pyodbc.Connection, batch_size: int, product_id: Optional[int] = None
) -> List[Dict]:
    """Fetch products without images from the database."""

    query = """
    SELECT
        ProductID,
        COALESCE(PT.Name, '') as ProductType, 
    COALESCE(
        NULLIF(
            REPLACE(REPLACE(REPLACE(REPLACE(PL.Name, CHAR(13), ''), CHAR(10), ''), CHAR(9), ''), ' ', ''), 
            ''
        ), 
        ''
    ) AS Brand, 

    COALESCE(
        NULLIF(
            TRANSLATE(P.Name + COALESCE(Description, ''), '!@#$%^&*()_+=[]{}|:;"<>,.?/~`', '                             '), 
            ''
        ), 
        ''
    ) AS Description
,
        COALESCE(
    CASE 
        WHEN LEN(UPCCode) IN (8, 12) 
             AND UPCCode NOT LIKE '%[^0-9]%' 
        THEN UPCCode 
        ELSE NULL 
    END, 
    ''
) AS UPC
,
        COALESCE(
            CASE
                WHEN VendorCode_Default LIKE '[0-9]%'
                    AND (LEN(VendorCode_Default) = 10 AND VendorCode_Default LIKE '[0-9Xx]')
                THEN VendorCode_Default -- Return ISBN-10
                WHEN VendorCode_Default LIKE '[0-9]%'
                    AND LEN(VendorCode_Default) = 13
                    AND VendorCode_Default NOT LIKE '%[^0-9]%'
                THEN VendorCode_Default -- Return ISBN-13
                ELSE NULL
            END, '') as ISBN
    FROM Product as P
    LEFT OUTER JOIN ProductType as PT ON PT.ProductTypeID = P.ProductTypeID 
    LEFT OUTER JOIN ProductLine as PL ON PL.ProductLineID = P.ProductLineID 
    WHERE ImageFileName IS NULL and P.Name is not null
    """

    # If a specific product ID is provided, add it to the query
    if product_id:
        query += f" AND ProductID = {product_id}"

    query += f" ORDER BY ProductID OFFSET 0 ROWS FETCH NEXT {batch_size} ROWS ONLY"

    try:
        cursor = conn.cursor()
        cursor.execute(query)

        columns = [column[0] for column in cursor.description]
        products = []

        for row in cursor.fetchall():
            product = dict(zip(columns, row))
            products.append(product)

        logger.info(f"Fetched {len(products)} products without images")
        return products

    except pyodbc.Error as e:
        logger.error(f"Error fetching products: {e}")
        raise


def call_product_image_api(config: Dict, product: Dict) -> Tuple[bool, Optional[str]]:
    """Call the Product Image API to get an image URL for a product."""

    api_url = f"{config['API_BASE_URL']}/api/product-image"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {config['API_KEY']}",
    }

    # Prepare the API request payload
    payload = {
        "productId": str(product["ProductID"]),
        "productType": product["ProductType"],
        "brand": product["Brand"],
        "description": product["Description"],
        "upc": product["UPC"],
        "isbn": product["ISBN"],
    }
    print(f"Calling API with payload: {json.dumps(payload, indent=4)}")
    logger.info(f"Calling API with payload: {json.dumps(payload, indent=4)}")

    retries = 0
    while retries <= config["MAX_RETRIES"]:
        try:
            logger.info(f"Calling API for product ID {product['ProductID']}")
            response = requests.post(api_url, json=payload, headers=headers)

            if response.status_code == 201:  # Created
                data = response.json()
                if "imageUrl" in data and data["imageUrl"]:
                    logger.info(f"API returned image URL: {data['imageUrl']}")
                    return True, data["imageUrl"]
                else:
                    logger.warning(f"API response missing imageUrl: {data}")
                    return False, None
            elif response.status_code == 429:  # Too Many Requests
                retry_after = int(
                    response.headers.get("Retry-After", config["RETRY_DELAY"])
                )
                logger.warning(f"Rate limit hit. Retrying after {retry_after} seconds.")
                time.sleep(retry_after)
                retries += 1
                continue
            else:
                logger.error(
                    f"API error: Status {response.status_code} - {response.text}"
                )
                return False, None

        except requests.RequestException as e:
            logger.error(f"API request failed: {e}")
            if retries < config["MAX_RETRIES"]:
                logger.info(
                    f"Retrying in {config['RETRY_DELAY']} seconds... (Attempt {retries+1}/{config['MAX_RETRIES']})"
                )
                time.sleep(config["RETRY_DELAY"])
                retries += 1
            else:
                return False, None

    return False, None


def update_product_image(
    conn: pyodbc.Connection, product_id: int, image_url: str, dry_run: bool
) -> bool:
    """Update the product's ImageFileName with the provided URL."""
    if dry_run:
        logger.info(
            f"DRY RUN: Would update product {product_id} with image URL: {image_url}"
        )
        return True

    query = "UPDATE Product SET ImageFileName = ? WHERE ProductID = ?"

    try:
        cursor = conn.cursor()
        cursor.execute(query, (image_url, product_id))
        conn.commit()

        if cursor.rowcount > 0:
            logger.info(f"Updated product {product_id} with image URL")
            return True
        else:
            logger.warning(f"No rows updated for product {product_id}")
            return False

    except pyodbc.Error as e:
        logger.error(f"Error updating product {product_id}: {e}")
        conn.rollback()
        return False


def main():
    """Main function to process products without images."""
    # Parse arguments
    config = parse_arguments()

    logger.info("Starting Product Image Updater")
    logger.info(
        f"Configuration: {json.dumps({k: v for k, v in config.items() if k != 'DB_PASSWORD'})}"
    )

    try:
        # Connect to database
        conn = connect_to_database(config)

        # Process one specific product if ID is provided
        if "PRODUCT_ID" in config and config["PRODUCT_ID"]:
            logger.info(f"Processing single product ID: {config['PRODUCT_ID']}")
            products = fetch_products_without_images(conn, 1, config["PRODUCT_ID"])
            if not products:
                logger.warning(
                    f"Product ID {config['PRODUCT_ID']} not found or already has an image"
                )
                return

            product = products[0]
            success, image_url = call_product_image_api(config, product)

            if success and image_url:
                update_success = update_product_image(
                    conn, product["ProductID"], image_url, config["DRY_RUN"]
                )
                if update_success:
                    logger.info(
                        f"Successfully processed product {product['ProductID']}"
                    )

        else:
            # Process in batches
            total_processed = 0
            total_updated = 0

            while True:
                # Fetch a batch of products
                products = fetch_products_without_images(conn, config["BATCH_SIZE"])

                if not products:
                    logger.info("No more products without images found.")
                    break

                for product in products:
                    # Call API to get image URL
                    success, image_url = call_product_image_api(config, product)

                    if success and image_url:
                        # Update database with image URL
                        update_success = update_product_image(
                            conn, product["ProductID"], image_url, config["DRY_RUN"]
                        )
                        if update_success:
                            total_updated += 1

                    total_processed += 1

                    # Sleep between API calls to avoid rate limiting
                    time.sleep(config["SLEEP_BETWEEN_CALLS"])

                logger.info(
                    f"Processed {total_processed} products, updated {total_updated}"
                )

                # If we processed fewer than the batch size, we're done
                if len(products) < config["BATCH_SIZE"]:
                    break

        logger.info("Image update process completed successfully")

    except Exception as e:
        logger.error(f"Unhandled error: {e}", exc_info=True)
    finally:
        if "conn" in locals() and conn:
            conn.close()
            logger.info("Database connection closed")


if __name__ == "__main__":
    main()
