#!/bin/bash
# Test script to verify the cookie consent API fix
# This script tests the fix for the 404 error on POST /api/cookie-consent/preferences

set -e

echo "=========================================="
echo "Cookie Consent API Fix - Verification Test"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
        return 1
    fi
}

# Check if docker compose is available
echo "Checking prerequisites..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi
print_status 0 "Docker is installed"

# Check if containers are running
echo ""
echo "Checking containers..."
if ! docker ps | grep -q "illegal-street-frontend"; then
    echo -e "${YELLOW}Warning: Frontend container is not running${NC}"
    echo "Start it with: docker compose up -d"
    exit 1
fi
print_status 0 "Frontend container is running"

if ! docker ps | grep -q "illegal-street-backend"; then
    echo -e "${YELLOW}Warning: Backend container is not running${NC}"
    echo "Start it with: docker compose up -d"
    exit 1
fi
print_status 0 "Backend container is running"

# Test 1: Backend health check
echo ""
echo "Test 1: Backend health check (direct)"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
if [ "$HTTP_CODE" = "200" ]; then
    print_status 0 "Backend is healthy (HTTP $HTTP_CODE)"
else
    print_status 1 "Backend health check failed (HTTP $HTTP_CODE)"
fi

# Test 2: Get cookie policy directly from backend
echo ""
echo "Test 2: Get cookie policy (direct backend)"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/cookie-consent/policy)
if [ "$HTTP_CODE" = "200" ]; then
    print_status 0 "Cookie policy endpoint works (HTTP $HTTP_CODE)"
else
    print_status 1 "Cookie policy endpoint failed (HTTP $HTTP_CODE)"
fi

# Test 3: Get cookie policy through nginx proxy
echo ""
echo "Test 3: Get cookie policy (via nginx proxy)"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/cookie-consent/policy)
if [ "$HTTP_CODE" = "200" ]; then
    print_status 0 "Nginx proxy works correctly (HTTP $HTTP_CODE)"
else
    print_status 1 "Nginx proxy failed (HTTP $HTTP_CODE)"
fi

# Test 4: POST cookie preferences (THE MAIN FIX)
echo ""
echo "Test 4: POST cookie preferences (via nginx proxy) - THE MAIN FIX"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:8080/api/cookie-consent/preferences \
    -H "Content-Type: application/json" \
    -d '{"necessary":true,"functional":true,"analytics":false,"marketing":false}' \
    -c /tmp/cookie_test_cookies.txt \
    -b /tmp/cookie_test_cookies.txt)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    print_status 0 "POST /api/cookie-consent/preferences works! (HTTP $HTTP_CODE)"
    echo ""
    echo "Response body:"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    
    # Check if cookies were set
    if [ -f /tmp/cookie_test_cookies.txt ]; then
        echo ""
        echo "Cookies set:"
        grep -E "cookie_consent" /tmp/cookie_test_cookies.txt || echo "No cookie consent cookies found"
    fi
else
    print_status 1 "POST failed (HTTP $HTTP_CODE)"
    echo "Response: $BODY"
fi

# Test 5: Verify cookies persist
echo ""
echo "Test 5: Retrieve saved preferences"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    http://localhost:8080/api/cookie-consent/preferences \
    -b /tmp/cookie_test_cookies.txt)

if [ "$HTTP_CODE" = "200" ]; then
    print_status 0 "Preferences can be retrieved (HTTP $HTTP_CODE)"
else
    print_status 1 "Failed to retrieve preferences (HTTP $HTTP_CODE)"
fi

# Test 6: Frontend static files
echo ""
echo "Test 6: Frontend static files"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/)
if [ "$HTTP_CODE" = "200" ]; then
    print_status 0 "Frontend index.html loads (HTTP $HTTP_CODE)"
else
    print_status 1 "Frontend failed to load (HTTP $HTTP_CODE)"
fi

# Test 7: Check nginx configuration
echo ""
echo "Test 7: Nginx configuration validation"
if docker exec illegal-street-frontend nginx -t &> /dev/null; then
    print_status 0 "Nginx configuration is valid"
else
    print_status 1 "Nginx configuration has errors"
fi

# Test 8: Network connectivity
echo ""
echo "Test 8: Network connectivity (frontend → backend)"
if docker exec illegal-street-frontend ping -c 1 backend &> /dev/null; then
    print_status 0 "Frontend can reach backend on Docker network"
else
    print_status 1 "Network connectivity issue"
fi

# Cleanup
rm -f /tmp/cookie_test_cookies.txt

# Summary
echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo ""
echo "If all tests passed, the cookie consent API fix is working correctly!"
echo "The 404 error on POST /api/cookie-consent/preferences has been resolved."
echo ""
echo "You can now:"
echo "1. Open http://localhost:8080 in your browser"
echo "2. The cookie consent banner should appear"
echo "3. Click 'Zaakceptuj wszystkie' (Accept All)"
echo "4. The request should succeed with HTTP 200"
echo "5. No 404 errors in the browser console"
echo ""
