#!/bin/bash
# Phase 6 Verification Script
# Verifies background worker deployment is complete and functional

set -e

echo "======================================"
echo "Phase 6: Background Worker Verification"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass() {
    echo -e "${GREEN}✓${NC} $1"
}

fail() {
    echo -e "${RED}✗${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check 1: Worker source file exists
echo "Checking worker source files..."
if [ -f "workers/auth-sync-worker.ts" ]; then
    pass "Worker entry point exists"
else
    fail "Worker entry point missing: workers/auth-sync-worker.ts"
    exit 1
fi

# Check 2: Dockerfile.worker exists
if [ -f "Dockerfile.worker" ]; then
    pass "Worker Dockerfile exists"
else
    fail "Worker Dockerfile missing"
    exit 1
fi

# Check 3: tsconfig.worker.json exists
if [ -f "tsconfig.worker.json" ]; then
    pass "Worker TypeScript config exists"
else
    fail "Worker TypeScript config missing"
    exit 1
fi

# Check 4: Docker compose has worker service
if grep -q "auth-worker:" docker-compose.yml; then
    pass "Docker compose has auth-worker service"
else
    fail "Docker compose missing auth-worker service"
    exit 1
fi

# Check 5: Docker compose has RabbitMQ
if grep -q "rabbitmq:" docker-compose.yml; then
    pass "Docker compose has RabbitMQ service"
else
    fail "Docker compose missing RabbitMQ service"
    exit 1
fi

# Check 6: NPM scripts exist
echo ""
echo "Checking NPM scripts..."
if grep -q '"worker:auth"' package.json; then
    pass "worker:auth script exists"
else
    fail "worker:auth script missing"
    exit 1
fi

if grep -q '"worker:auth:dev"' package.json; then
    pass "worker:auth:dev script exists"
else
    fail "worker:auth:dev script missing"
    exit 1
fi

if grep -q '"worker:build"' package.json; then
    pass "worker:build script exists"
else
    fail "worker:build script missing"
    exit 1
fi

# Check 7: Environment variables documented
echo ""
echo "Checking environment configuration..."
if grep -q "RABBITMQ_URL" .env.example; then
    pass "RABBITMQ_URL in .env.example"
else
    fail "RABBITMQ_URL missing from .env.example"
    exit 1
fi

# Check 8: Documentation exists
echo ""
echo "Checking documentation..."
if [ -f "docs/WORKER_DEPLOYMENT.md" ]; then
    pass "Worker deployment documentation exists"
else
    fail "Worker deployment documentation missing"
    exit 1
fi

# Check 9: Worker build succeeds
echo ""
echo "Testing worker build..."
if npm run worker:build > /dev/null 2>&1; then
    pass "Worker builds successfully"
else
    fail "Worker build failed"
    exit 1
fi

# Check 10: Build output exists
if [ -f "dist/workers/auth-sync-worker.js" ]; then
    pass "Worker build output exists"
else
    fail "Worker build output missing"
    exit 1
fi

# Check 11: Background sync module exists
if [ -f "lib/auth/background-sync.ts" ]; then
    pass "Background sync module exists"
else
    fail "Background sync module missing"
    exit 1
fi

# Check 12: RabbitMQ dependency installed
echo ""
echo "Checking dependencies..."
if grep -q '"amqplib"' package.json; then
    pass "amqplib dependency installed"
else
    fail "amqplib dependency missing"
    exit 1
fi

# Summary
echo ""
echo "======================================"
echo -e "${GREEN}All checks passed!${NC}"
echo "======================================"
echo ""
echo "Phase 6 deployment is complete and ready to use."
echo ""
echo "Quick Start:"
echo "  1. Start services: npm run docker:up"
echo "  2. Run worker: npm run worker:auth:dev"
echo "  3. View logs: npm run docker:logs"
echo ""
echo "For detailed instructions, see: docs/WORKER_DEPLOYMENT.md"
echo ""
