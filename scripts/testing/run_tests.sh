#!/bin/bash
# Test runner script for Secure Medical Notes AI

set -e

echo "🧪 Running Test Suite for Secure Medical Notes AI"
echo "=================================================="

# Check if virtual environment exists
if [ -d ".venv" ]; then
    echo "✅ Activating virtual environment..."
    source .venv/bin/activate
elif [ -d "venv" ]; then
    echo "✅ Activating virtual environment..."
    source venv/bin/activate
else
    echo "⚠️  No virtual environment found. Using system Python."
fi

# Install test dependencies if needed
echo ""
echo "📦 Checking test dependencies..."
pip install -q pytest pytest-cov httpx locust 2>/dev/null || {
    echo "Installing test dependencies..."
    pip install pytest pytest-cov httpx locust
}

# Run tests
echo ""
echo "🚀 Running unit tests..."
pytest tests/ -v --tb=short

echo ""
echo "✅ Test suite completed!"
echo ""
echo "To run load tests, use:"
echo "  locust -f locustfile.py --host=http://localhost:8000"

