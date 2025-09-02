#!/bin/bash

# Deployment Verification Script
# This script performs comprehensive checks after deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_URL="${VERCEL_URL:-${NEXT_PUBLIC_APP_URL:-http://localhost:3000}}"
TIMEOUT=30
MAX_RETRIES=5

echo -e "${BLUE}🚀 Starting deployment verification for: $DEPLOYMENT_URL${NC}"

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "SUCCESS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
    esac
}

# Function to wait for deployment to be ready
wait_for_deployment() {
    local url=$1
    local retries=0
    
    print_status "INFO" "Waiting for deployment to be ready..."
    
    while [ $retries -lt $MAX_RETRIES ]; do
        if curl -s --max-time $TIMEOUT "$url/api/health" > /dev/null; then
            print_status "SUCCESS" "Deployment is ready!"
            return 0
        fi
        
        retries=$((retries + 1))
        print_status "WARNING" "Attempt $retries/$MAX_RETRIES failed, waiting 10 seconds..."
        sleep 10
    done
    
    print_status "ERROR" "Deployment did not become ready within timeout period"
    return 1
}

# Function to check health endpoint
check_health() {
    print_status "INFO" "Checking health endpoint..."
    
    local response=$(curl -s --max-time $TIMEOUT "$DEPLOYMENT_URL/api/health")
    local http_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$DEPLOYMENT_URL/api/health")
    
    if [ "$http_status" != "200" ]; then
        print_status "ERROR" "Health check failed with HTTP $http_status"
        return 1
    fi
    
    # Check response structure
    if echo "$response" | jq -e '.status == "healthy"' > /dev/null 2>&1; then
        print_status "SUCCESS" "Health check passed"
        
        # Extract and display environment info
        local environment=$(echo "$response" | jq -r '.environment')
        local version=$(echo "$response" | jq -r '.version')
        print_status "INFO" "Environment: $environment, Version: $version"
    else
        print_status "ERROR" "Health check returned unhealthy status"
        echo "$response"
        return 1
    fi
}

# Function to check static assets
check_static_assets() {
    print_status "INFO" "Checking static assets..."
    
    local assets=("favicon.ico" "logo.svg" "robots.txt" "sitemap.xml" "manifest.json")
    local failed=0
    
    for asset in "${assets[@]}"; do
        local http_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$DEPLOYMENT_URL/$asset")
        
        if [ "$http_status" = "200" ]; then
            print_status "SUCCESS" "$asset is accessible"
        else
            print_status "ERROR" "$asset returned HTTP $http_status"
            failed=1
        fi
    done
    
    if [ $failed -eq 0 ]; then
        print_status "SUCCESS" "All static assets are accessible"
    else
        return 1
    fi
}

# Function to check security headers
check_security_headers() {
    print_status "INFO" "Checking security headers..."
    
    local headers=$(curl -s -I --max-time $TIMEOUT "$DEPLOYMENT_URL")
    local failed=0
    
    # Required security headers
    local required_headers=(
        "x-content-type-options"
        "x-frame-options"
        "x-xss-protection"
        "referrer-policy"
    )
    
    for header in "${required_headers[@]}"; do
        if echo "$headers" | grep -i "$header" > /dev/null; then
            print_status "SUCCESS" "$header header is present"
        else
            print_status "WARNING" "$header header is missing"
        fi
    done
    
    # Check that sensitive headers are not present
    if echo "$headers" | grep -i "x-powered-by" > /dev/null; then
        print_status "WARNING" "x-powered-by header should be removed"
    else
        print_status "SUCCESS" "x-powered-by header is properly hidden"
    fi
}

# Function to check performance
check_performance() {
    print_status "INFO" "Checking performance..."
    
    local start_time=$(date +%s%N)
    local http_status=$(curl -s -o /dev/null -w "%{http_code};%{time_total}" --max-time $TIMEOUT "$DEPLOYMENT_URL")
    local end_time=$(date +%s%N)
    
    local status_code=$(echo "$http_status" | cut -d';' -f1)
    local response_time=$(echo "$http_status" | cut -d';' -f2)
    
    if [ "$status_code" = "200" ]; then
        # Convert response time to milliseconds
        local response_time_ms=$(echo "$response_time * 1000" | bc -l | cut -d'.' -f1)
        
        print_status "INFO" "Homepage response time: ${response_time_ms}ms"
        
        if [ "$response_time_ms" -lt 3000 ]; then
            print_status "SUCCESS" "Response time is within acceptable range"
        else
            print_status "WARNING" "Response time exceeds 3000ms target"
        fi
    else
        print_status "ERROR" "Homepage returned HTTP $status_code"
        return 1
    fi
}

# Function to run smoke tests
run_smoke_tests() {
    print_status "INFO" "Running automated smoke tests..."
    
    if npm test -- tests/deployment/smoke.test.ts; then
        print_status "SUCCESS" "Smoke tests passed"
    else
        print_status "ERROR" "Smoke tests failed"
        return 1
    fi
}

# Main verification process
main() {
    local exit_code=0
    
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}         DEPLOYMENT VERIFICATION REPORT         ${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
    
    # Wait for deployment to be ready
    if ! wait_for_deployment "$DEPLOYMENT_URL"; then
        exit_code=1
    fi
    
    # Run health check
    if ! check_health; then
        exit_code=1
    fi
    
    # Check static assets
    if ! check_static_assets; then
        exit_code=1
    fi
    
    # Check security headers
    check_security_headers
    
    # Check performance
    if ! check_performance; then
        exit_code=1
    fi
    
    # Run automated smoke tests
    if ! run_smoke_tests; then
        exit_code=1
    fi
    
    echo ""
    echo -e "${BLUE}================================================${NC}"
    
    if [ $exit_code -eq 0 ]; then
        print_status "SUCCESS" "All deployment verification checks passed!"
        echo -e "${GREEN}🎉 Deployment is ready for production use!${NC}"
    else
        print_status "ERROR" "Some deployment verification checks failed"
        echo -e "${RED}🚨 Please review and fix the issues before proceeding${NC}"
    fi
    
    echo -e "${BLUE}================================================${NC}"
    
    exit $exit_code
}

# Run main function
main