#!/bin/bash

#############################################################################
# API Health Check Script
#
# Tests the health of various API endpoints to verify the application is
# properly configured and running. Supports testing different environments
# via the BASE_URL parameter.
#
# Usage:
#   ./scripts/health-check.sh                    # Uses http://localhost:3000
#   ./scripts/health-check.sh https://example.com
#
# Exit codes:
#   0 - All health checks passed
#   1 - One or more health checks failed
#
# Requirements:
#   - curl
#   - jq (optional, for pretty-printing JSON responses)
#############################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${1:-http://localhost:3000}"
TIMEOUT=10
FAILED_CHECKS=0
PASSED_CHECKS=0

# Check if curl is available
if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl is not installed${NC}"
    exit 1
fi

# Helper function to check if jq is available
has_jq() {
    command -v jq &> /dev/null
}

# Helper function to print formatted output
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# Helper function to test an endpoint
test_endpoint() {
    local endpoint=$1
    local expected_code=$2
    local method=${3:-GET}
    local auth_header=${4:-}
    local description=${5:-}

    local url="${BASE_URL}${endpoint}"
    local curl_opts=("-s" "-o" "/dev/null" "-w" "%{http_code}")

    # Add method if not GET
    if [ "$method" != "GET" ]; then
        curl_opts+=("-X" "$method")
    fi

    # Add auth header if provided
    if [ -n "$auth_header" ]; then
        curl_opts+=("-H" "$auth_header")
    fi

    # Add timeout
    curl_opts+=("--max-time" "$TIMEOUT")

    # Execute request
    local http_code
    http_code=$(curl "${curl_opts[@]}" "$url" 2>/dev/null || echo "000")

    # Check result
    if [ "$http_code" = "$expected_code" ]; then
        echo -e "${GREEN}✓ $endpoint${NC}"
        if [ -n "$description" ]; then
            echo -e "  ${BLUE}Expected: HTTP $expected_code | Got: HTTP $http_code${NC}"
        fi
        echo -e "  ${BLUE}Description: $description${NC}"
        ((PASSED_CHECKS++))
    else
        echo -e "${RED}✗ $endpoint${NC}"
        echo -e "  ${RED}Expected: HTTP $expected_code | Got: HTTP $http_code${NC}"
        if [ -n "$description" ]; then
            echo -e "  ${BLUE}Description: $description${NC}"
        fi
        ((FAILED_CHECKS++))
    fi
}

# Test endpoint with response
test_endpoint_response() {
    local endpoint=$1
    local expected_code=$2
    local method=${3:-GET}
    local auth_header=${4:-}
    local description=${5:-}

    local url="${BASE_URL}${endpoint}"
    local response_file=$(mktemp)
    local curl_opts=("-s" "-w" "%{http_code}" "-o" "$response_file")

    # Add method if not GET
    if [ "$method" != "GET" ]; then
        curl_opts+=("-X" "$method")
    fi

    # Add auth header if provided
    if [ -n "$auth_header" ]; then
        curl_opts+=("-H" "$auth_header")
    fi

    # Add timeout
    curl_opts+=("--max-time" "$TIMEOUT")

    # Execute request
    local http_code
    http_code=$(curl "${curl_opts[@]}" "$url" 2>/dev/null || echo "000")

    local response
    response=$(cat "$response_file" 2>/dev/null || echo "")
    rm -f "$response_file"

    # Check result
    if [ "$http_code" = "$expected_code" ]; then
        echo -e "${GREEN}✓ $endpoint${NC}"
        echo -e "  ${BLUE}Expected: HTTP $expected_code | Got: HTTP $http_code${NC}"
        if [ -n "$description" ]; then
            echo -e "  ${BLUE}Description: $description${NC}"
        fi

        # Pretty-print JSON response if jq is available
        if has_jq && [ -n "$response" ]; then
            echo -e "  ${BLUE}Response:${NC}"
            echo "$response" | jq '.' 2>/dev/null | sed 's/^/    /' || echo "    $response" | sed 's/^/    /'
        elif [ -n "$response" ]; then
            echo -e "  ${BLUE}Response: $response${NC}"
        fi

        ((PASSED_CHECKS++))
    else
        echo -e "${RED}✗ $endpoint${NC}"
        echo -e "  ${RED}Expected: HTTP $expected_code | Got: HTTP $http_code${NC}"
        if [ -n "$description" ]; then
            echo -e "  ${BLUE}Description: $description${NC}"
        fi
        if [ -n "$response" ]; then
            echo -e "  ${RED}Response: $response${NC}"
        fi
        ((FAILED_CHECKS++))
    fi
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "API Health Check for Stormwater Watch"
    echo "Testing: ${BASE_URL}"
    echo "Timeout: ${TIMEOUT}s"
    echo -e "${NC}"

    # Public endpoints - should return 200
    print_header "PUBLIC ENDPOINTS (expect HTTP 200)"
    test_endpoint_response "/api/health" "200" "GET" "" "Comprehensive health check of all services"

    # Test protected endpoints without auth - should return 401
    print_header "PROTECTED ENDPOINTS (expect HTTP 401 without auth)"
    test_endpoint "/api/violations" "401" "GET" "" "List violations - requires authentication"
    test_endpoint "/api/subscriptions" "401" "GET" "" "Manage subscriptions - requires authentication"

    # Test cron endpoints without secret - should return 401
    print_header "CRON/ADMIN ENDPOINTS (expect HTTP 401 without CRON_SECRET)"
    test_endpoint "/api/cron/weather-update" "401" "POST" "" "Weather update job - requires CRON_SECRET"
    test_endpoint "/api/cron/alert-check" "401" "POST" "" "Alert check job - requires CRON_SECRET"

    # Print summary
    print_header "HEALTH CHECK SUMMARY"

    local total=$((PASSED_CHECKS + FAILED_CHECKS))
    echo -e "Total checks: ${BLUE}$total${NC}"
    echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
    echo -e "Failed: ${RED}$FAILED_CHECKS${NC}"

    if [ $FAILED_CHECKS -eq 0 ]; then
        echo -e "\n${GREEN}✓ All health checks passed!${NC}\n"
        return 0
    else
        echo -e "\n${RED}✗ $FAILED_CHECKS check(s) failed. See details above.${NC}\n"
        return 1
    fi
}

# Run main function
main
exit $?
