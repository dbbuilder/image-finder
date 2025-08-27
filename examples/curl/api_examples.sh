#!/bin/bash
# Image Finder API - cURL Examples
# 
# This script demonstrates how to use the Image Finder API
# using cURL commands from the command line.
#
# Usage:
#   1. Set your API_KEY and API_BASE_URL environment variables
#   2. Make the script executable: chmod +x api_examples.sh
#   3. Run: ./api_examples.sh

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:3000/api}"
API_KEY="${API_KEY:-your-api-key-here}"

if [ "$API_KEY" = "your-api-key-here" ]; then
    echo "❌ Error: Please set your API_KEY environment variable"
    echo "Example: export API_KEY='your-actual-api-key'"
    exit 1
fi

echo "🚀 Image Finder API - cURL Examples"
echo "Base URL: $API_BASE_URL"
echo "API Key: ${API_KEY:0:10}..." 
echo ""

# Common headers
HEADERS=(-H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json")

echo "============================================"
echo "1. Health Check"
echo "============================================"
curl -s "${API_BASE_URL%/api}/health" | jq '.' || echo "Health check response received"
echo -e "\n"

echo "============================================"
echo "2. Create Laptop Product Image"
echo "============================================"
curl -s -X POST "$API_BASE_URL/product-image" \
    "${HEADERS[@]}" \
    -d '{
        "productId": "LAP-CURL-001",
        "productType": "Laptop",
        "brand": "TechBrand",
        "description": "15-inch gaming laptop with RTX 4070 graphics"
    }' | jq '.' || echo "Response received (JSON parsing failed)"
echo -e "\n"

echo "============================================"
echo "3. Create Product with UPC"
echo "============================================"
curl -s -X POST "$API_BASE_URL/product-image" \
    "${HEADERS[@]}" \
    -d '{
        "productId": "UPC-CURL-001",
        "productType": "Electronics",
        "upc": "123456789012",
        "brand": "Samsung",
        "description": "Wireless noise-cancelling headphones"
    }' | jq '.' || echo "Response received (JSON parsing failed)"
echo -e "\n"

echo "============================================"
echo "4. Create Book Image with ISBN"
echo "============================================"
curl -s -X POST "$API_BASE_URL/product-image" \
    "${HEADERS[@]}" \
    -d '{
        "productId": "BOOK-CURL-001",
        "productType": "Book",
        "isbn": "9781234567897",
        "description": "Complete guide to modern web development",
        "brand": "Tech Publisher"
    }' | jq '.' || echo "Response received (JSON parsing failed)"
echo -e "\n"

echo "============================================"
echo "5. Check if Image Exists"
echo "============================================"
curl -s -X GET "$API_BASE_URL/product-image/LAP-CURL-001" \
    "${HEADERS[@]}" | jq '.' || echo "Response received (JSON parsing failed)"
echo -e "\n"

echo "============================================"
echo "6. Error Example - Missing Product ID"
echo "============================================"
curl -s -X POST "$API_BASE_URL/product-image" \
    "${HEADERS[@]}" \
    -d '{
        "productType": "Laptop",
        "description": "This will fail - no productId"
    }' | jq '.' || echo "Error response received (JSON parsing failed)"
echo -e "\n"

echo "============================================"
echo "7. Error Example - No Search Parameters"
echo "============================================"
curl -s -X POST "$API_BASE_URL/product-image" \
    "${HEADERS[@]}" \
    -d '{
        "productId": "FAIL-001"
    }' | jq '.' || echo "Error response received (JSON parsing failed)"
echo -e "\n"

echo "============================================"
echo "8. Check Non-Existent Image"
echo "============================================"
curl -s -X GET "$API_BASE_URL/product-image/NON-EXISTENT-999" \
    "${HEADERS[@]}" | jq '.' || echo "404 response received (JSON parsing failed)"
echo -e "\n"

echo "============================================"
echo "9. Delete Product Image"
echo "============================================"
curl -s -X DELETE "$API_BASE_URL/product-image/LAP-CURL-001" \
    "${HEADERS[@]}" | jq '.' || echo "Response received (JSON parsing failed)"
echo -e "\n"

echo "============================================"
echo "10. Rate Limiting Example"
echo "============================================"
echo "Making multiple rapid requests to test rate limiting..."

for i in {1..5}; do
    echo "Request $i/5..."
    curl -s -X POST "$API_BASE_URL/product-image" \
        "${HEADERS[@]}" \
        -w "\nHTTP Status: %{http_code}\n" \
        -d "{
            \"productId\": \"RATE-TEST-$i\",
            \"productType\": \"Test Product\",
            \"description\": \"Rate limiting test $i\"
        }" | head -20
    echo ""
    
    # Small delay between requests
    sleep 0.5
done

echo "============================================"
echo "11. Authentication Error Example"
echo "============================================"
curl -s -X GET "$API_BASE_URL/product-image/TEST-001" \
    -H "Content-Type: application/json" \
    -w "\nHTTP Status: %{http_code}\n" | jq '.' || echo "Auth error response received"
echo -e "\n"

echo "✅ cURL examples completed!"
echo ""
echo "📝 Notes:"
echo "- Replace 'your-api-key-here' with your actual API key"
echo "- Install 'jq' for better JSON formatting: sudo apt-get install jq"
echo "- Check HTTP status codes for error handling"
echo "- Respect rate limits (25 requests per minute)"