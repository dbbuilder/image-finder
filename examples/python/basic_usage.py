#!/usr/bin/env python3
"""
Basic Product Image API Usage Examples - Python

This file demonstrates how to use the Product Image API
in a Python environment using the requests library.

Install dependencies:
pip install requests python-dotenv
"""

import os
import json
import time
from typing import Dict, List, Optional
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:3000/api')
API_KEY = os.getenv('API_KEY')

if not API_KEY:
    raise ValueError('API_KEY environment variable is required')

class ProductImageAPIClient:
    """Client for the Product Image API"""
    
    def __init__(self, base_url: str, api_key: str, timeout: int = 30):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        })
        self.timeout = timeout
    
    def create_product_image(self, product_data: Dict) -> Dict:
        """Create a product image"""
        url = f'{self.base_url}/product-image'
        response = self.session.post(url, json=product_data, timeout=self.timeout)
        response.raise_for_status()
        return response.json()
    
    def check_image_exists(self, product_id: str) -> Dict:
        """Check if a product image exists"""
        url = f'{self.base_url}/product-image/{product_id}'
        response = self.session.get(url, timeout=self.timeout)
        
        if response.status_code == 404:
            return {'exists': False}
        
        response.raise_for_status()
        return response.json()
    
    def delete_product_image(self, product_id: str) -> Dict:
        """Delete a product image"""
        url = f'{self.base_url}/product-image/{product_id}'
        response = self.session.delete(url, timeout=self.timeout)
        
        if response.status_code == 404:
            return {'success': False, 'message': 'Image not found'}
        
        response.raise_for_status()
        return response.json()
    
    def health_check(self) -> Dict:
        """Check API health"""
        url = f'{self.base_url.replace("/api", "")}/health'
        response = self.session.get(url, timeout=5)
        response.raise_for_status()
        return response.json()

# Initialize API client
client = ProductImageAPIClient(API_BASE_URL, API_KEY)

def create_laptop_image():
    """Example 1: Create product image for a laptop"""
    print('Creating image for laptop...')
    
    product_data = {
        'productId': 'LAP-001-PY',
        'productType': 'Laptop',
        'brand': 'TechBrand',
        'description': '15-inch gaming laptop with RTX 4070 graphics card'
    }
    
    try:
        result = client.create_product_image(product_data)
        print('✅ Success:', json.dumps(result, indent=2))
        print('Image URL:', result['imageUrl'])
        return result
    except requests.exceptions.RequestException as e:
        print(f'❌ Error creating laptop image: {e}')
        if hasattr(e, 'response') and e.response is not None:
            print('Error details:', e.response.text)
        raise

def create_product_by_upc():
    """Example 2: Create product image using UPC code"""
    print('Creating image for product with UPC...')
    
    product_data = {
        'productId': 'UPC-001-PY',
        'productType': 'Electronics',
        'upc': '123456789012',
        'brand': 'Samsung',
        'description': 'Wireless noise-cancelling headphones'
    }
    
    try:
        result = client.create_product_image(product_data)
        print('✅ Success:', json.dumps(result, indent=2))
        return result
    except requests.exceptions.RequestException as e:
        print(f'❌ Error creating UPC product image: {e}')
        if hasattr(e, 'response') and e.response is not None:
            print('Error details:', e.response.text)
        raise

def create_book_image():
    """Example 3: Create book image using ISBN"""
    print('Creating image for book...')
    
    product_data = {
        'productId': 'BOOK-001-PY',
        'productType': 'Book',
        'isbn': '9781234567897',
        'description': 'Complete guide to modern web development',
        'brand': 'Tech Publisher'
    }
    
    try:
        result = client.create_product_image(product_data)
        print('✅ Success:', json.dumps(result, indent=2))
        return result
    except requests.exceptions.RequestException as e:
        print(f'❌ Error creating book image: {e}')
        if hasattr(e, 'response') and e.response is not None:
            print('Error details:', e.response.text)
        raise

def check_image_exists(product_id: str):
    """Example 4: Check if product image exists"""
    print(f'Checking if image exists for product: {product_id}...')
    
    try:
        result = client.check_image_exists(product_id)
        
        if result.get('exists'):
            print('✅ Image exists:', json.dumps(result, indent=2))
        else:
            print('ℹ️ Image not found for product:', product_id)
        
        return result
    except requests.exceptions.RequestException as e:
        print(f'❌ Error checking image: {e}')
        if hasattr(e, 'response') and e.response is not None:
            print('Error details:', e.response.text)
        raise

def delete_product_image(product_id: str):
    """Example 5: Delete product image"""
    print(f'Deleting image for product: {product_id}...')
    
    try:
        result = client.delete_product_image(product_id)
        
        if result.get('success'):
            print('✅ Image deleted:', json.dumps(result, indent=2))
        else:
            print('ℹ️ Image not found for deletion:', product_id)
        
        return result
    except requests.exceptions.RequestException as e:
        print(f'❌ Error deleting image: {e}')
        if hasattr(e, 'response') and e.response is not None:
            print('Error details:', e.response.text)
        raise

def batch_process_products():
    """Example 6: Batch process multiple products"""
    products = [
        {
            'productId': 'MOUSE-001-PY',
            'productType': 'Computer Mouse',
            'brand': 'Logitech',
            'description': 'Wireless ergonomic mouse'
        },
        {
            'productId': 'KEYBOARD-001-PY',
            'productType': 'Keyboard',
            'brand': 'Corsair',
            'description': 'Mechanical gaming keyboard with RGB lighting'
        },
        {
            'productId': 'MONITOR-001-PY',
            'productType': 'Monitor',
            'brand': 'Dell',
            'description': '27-inch 4K display'
        }
    ]
    
    print('Starting batch processing...')
    results = []
    
    for product in products:
        try:
            print(f"Processing: {product['productId']}...")
            
            result = client.create_product_image(product)
            results.append({
                'productId': product['productId'],
                'success': True,
                'imageUrl': result['imageUrl']
            })
            
            print(f"✅ Completed: {product['productId']}")
            
            # Add delay to respect rate limiting
            time.sleep(1)
            
        except requests.exceptions.RequestException as e:
            error_msg = str(e)
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_data = e.response.json()
                    error_msg = error_data.get('error', str(e))
                except:
                    error_msg = e.response.text or str(e)
            
            results.append({
                'productId': product['productId'],
                'success': False,
                'error': error_msg
            })
            print(f"❌ Failed: {product['productId']} - {error_msg}")
    
    print('\n📊 Batch Processing Results:')
    for result in results:
        if result['success']:
            print(f"✅ {result['productId']}: {result['imageUrl']}")
        else:
            print(f"❌ {result['productId']}: {result['error']}")
    
    return results

def create_image_with_retry(product_data: Dict, max_retries: int = 3):
    """Example 7: Error handling and retry logic"""
    for attempt in range(1, max_retries + 1):
        try:
            print(f"Attempt {attempt}/{max_retries} for product: {product_data['productId']}")
            
            result = client.create_product_image(product_data)
            print(f'✅ Success on attempt {attempt}')
            return result
            
        except requests.exceptions.RequestException as e:
            error_msg = str(e)
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_data = e.response.json()
                    error_msg = error_data.get('error', str(e))
                except:
                    error_msg = e.response.text or str(e)
            
            print(f'❌ Attempt {attempt} failed: {error_msg}')
            
            if attempt == max_retries:
                raise Exception(f'Failed after {max_retries} attempts: {error_msg}')
            
            # Wait before retry (exponential backoff)
            delay = 2 ** attempt
            print(f'⏳ Waiting {delay}s before retry...')
            time.sleep(delay)

def run_examples():
    """Main function to run all examples"""
    print('🚀 Starting Product Image API Examples\n')
    
    try:
        # Health check first
        health = client.health_check()
        print('API Health:', health)
        print('\n---\n')
        
        # Example 1: Create laptop image
        create_laptop_image()
        print('\n---\n')
        
        # Example 2: Create product by UPC
        create_product_by_upc()
        print('\n---\n')
        
        # Example 3: Create book image
        create_book_image()
        print('\n---\n')
        
        # Example 4: Check if image exists
        check_image_exists('LAP-001-PY')
        print('\n---\n')
        
        # Example 5: Batch processing
        batch_process_products()
        print('\n---\n')
        
        # Example 6: Retry logic example
        create_image_with_retry({
            'productId': 'RETRY-001-PY',
            'productType': 'Test Product',
            'description': 'Product for testing retry logic'
        })
        
        print('\n✅ All examples completed successfully!')
        
    except Exception as error:
        print(f'\n❌ Examples failed: {error}')

if __name__ == '__main__':
    run_examples()