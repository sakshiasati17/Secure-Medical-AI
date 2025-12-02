# 🧪 Testing Guide

**Date:** December 1, 2025  
**Status:** ✅ Testing Infrastructure Implemented

---

## 📋 Test Suite Overview

### ✅ Implemented Tests

1. **Unit Tests** (`tests/test_*.py`)
   - ✅ `test_auth.py` - Authentication tests (8 tests)
   - ✅ `test_patients.py` - Patient CRUD tests (7 tests)
   - ✅ `test_notes.py` - Notes CRUD tests (7 tests)
   - ✅ `test_integration.py` - End-to-end workflow tests (4 tests)

2. **Load Testing** (`locustfile.py`)
   - ✅ Locust configuration for performance testing
   - ✅ Simulates multiple user types (read/write)
   - ✅ Tests concurrent user scenarios

---

## 🚀 Running Tests

### Prerequisites

Install test dependencies:
```bash
pip install -r requirements.txt
```

### Run All Tests

```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run with coverage report
pytest --cov=api --cov-report=html

# Run specific test file
pytest tests/test_auth.py -v

# Run specific test
pytest tests/test_auth.py::test_login_success -v
```

### Test Output Example

```
tests/test_auth.py::test_register_user_success PASSED
tests/test_auth.py::test_register_duplicate_email PASSED
tests/test_auth.py::test_login_success PASSED
tests/test_auth.py::test_login_invalid_email PASSED
...
```

---

## 📊 Load Testing with Locust

### Start Locust

```bash
# Start Locust web UI (default: http://localhost:8089)
locust -f locustfile.py

# Or specify host
locust -f locustfile.py --host=http://localhost:8000

# Headless mode (no UI)
locust -f locustfile.py --headless -u 50 -r 5 -t 60s
```

### Load Test Scenarios

**Scenario 1: Light Load**
- Users: 10
- Spawn rate: 2 users/second
- Duration: 2 minutes

**Scenario 2: Medium Load**
- Users: 50
- Spawn rate: 5 users/second
- Duration: 5 minutes

**Scenario 3: Heavy Load**
- Users: 100
- Spawn rate: 10 users/second
- Duration: 10 minutes

### Load Test Metrics

Locust provides:
- **Requests per second (RPS)**
- **Response times** (min, max, median, p95, p99)
- **Failure rate**
- **Number of users**

---

## 🧪 Test Coverage

### Current Coverage

- **Authentication**: ✅ 100% endpoint coverage
- **Patients**: ✅ 100% endpoint coverage
- **Notes**: ✅ 100% endpoint coverage
- **Integration**: ✅ End-to-end workflows

### Test Database

Tests use **in-memory SQLite** database:
- ✅ Isolated from production database
- ✅ Fresh database for each test
- ✅ No data persistence between tests
- ✅ Fast execution

---

## 📝 Test Structure

```
tests/
├── __init__.py              # Package marker
├── conftest.py              # Pytest fixtures
├── test_auth.py            # Authentication tests
├── test_patients.py        # Patient tests
├── test_notes.py           # Notes tests
└── test_integration.py     # Integration tests
```

---

## 🔧 Test Fixtures

### Available Fixtures

- `db` - Database session (fresh for each test)
- `client` - FastAPI test client
- `test_user` - Test user (doctor role)
- `test_doctor` - Doctor user
- `test_nurse` - Nurse user
- `test_patient` - Test patient
- `auth_headers` - Authentication headers

---

## 📈 Performance Testing Results

### Expected Performance

Based on architecture:
- **API Response Time**: < 200ms (p95)
- **Concurrent Users**: 100+ supported
- **Requests per Second**: 500+ (theoretical)
- **Database Queries**: < 50ms

### Running Performance Tests

```bash
# Start backend server
uvicorn api.main:app --host 0.0.0.0 --port 8000

# In another terminal, run Locust
locust -f locustfile.py --host=http://localhost:8000
```

### Interpreting Results

1. **Response Times**:
   - Good: < 200ms (p95)
   - Acceptable: < 500ms (p95)
   - Needs optimization: > 500ms (p95)

2. **Failure Rate**:
   - Good: < 0.1%
   - Acceptable: < 1%
   - Needs attention: > 1%

3. **Requests per Second**:
   - Monitor as users increase
   - Identify when RPS plateaus (bottleneck)

---

## 🐛 Debugging Tests

### Common Issues

1. **Database Connection Errors**
   - Ensure test database is properly configured
   - Check `conftest.py` database setup

2. **Authentication Failures**
   - Verify user fixtures are created correctly
   - Check dependency overrides in `conftest.py`

3. **Import Errors**
   - Ensure all dependencies are installed
   - Check Python path includes project root

### Debug Mode

```bash
# Run with print statements
pytest -s

# Run with pdb debugger
pytest --pdb

# Run with detailed output
pytest -vv
```

---

## ✅ Test Checklist

Before submitting:
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Load test run and documented
- [ ] Test coverage > 70%
- [ ] No test warnings
- [ ] Tests don't affect production database

---

## 📚 Additional Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [Locust Documentation](https://docs.locust.io/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)

---

**Status**: ✅ **Testing Infrastructure Complete**

