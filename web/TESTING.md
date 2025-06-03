# DiploSense Testing Guide

This document provides comprehensive guidance for testing the DiploSense web application, including debugging tools and test strategies.

## Quick Start

```bash
# Install test dependencies
npm install

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Debug specific component
node scripts/test-debug.js debug Dashboard
```

## Test Structure

### Test Files Organization
```
web/
├── src/
│   ├── components/
│   │   └── __tests__/
│   │       ├── Dashboard.test.tsx
│   │       └── UploadPanel.test.tsx
│   ├── app/
│   │   └── __tests__/
│   │       └── page.test.tsx
│   └── test-utils/
│       ├── mockData.ts
│       └── testUtils.tsx
├── __tests__/
│   └── api-integration.test.ts
├── scripts/
│   └── test-debug.js
├── jest.config.js
└── jest.setup.js
```

## Test Categories

### 1. Unit Tests
Test individual components in isolation:
- **Dashboard.test.tsx**: Tests dashboard rendering, data processing, modal functionality
- **UploadPanel.test.tsx**: Tests file uploads, form interactions, API calls

### 2. Integration Tests  
Test component interactions and data flow:
- **page.test.tsx**: Tests main page, WebSocket connections, component integration

### 3. API Integration Tests
Test API endpoints and WebSocket functionality:
- **api-integration.test.ts**: Tests all API endpoints, WebSocket communication

## Debug Tools

### Test Debug Script
The `scripts/test-debug.js` provides several debugging utilities:

```bash
# Check test setup
node scripts/test-debug.js setup

# List all test suites
node scripts/test-debug.js list

# Debug specific component
node scripts/test-debug.js debug Dashboard

# Run tests with filtering
node scripts/test-debug.js run "modal"

# Generate coverage report
node scripts/test-debug.js coverage

# Start watch mode
node scripts/test-debug.js watch
```

### Common Debug Scenarios

#### 1. Dashboard Not Updating in Real-time
```bash
# Test WebSocket data flow
node scripts/test-debug.js debug page

# Test data processing logic
node scripts/test-debug.js run "emotion data processing"

# Check mock WebSocket setup
node scripts/test-debug.js run "WebSocket"
```

#### 2. Modal Not Opening
```bash
# Test modal functionality
node scripts/test-debug.js run "modal"

# Debug click handlers
node scripts/test-debug.js debug Dashboard

# Check event handling
node scripts/test-debug.js run "clickable"
```

#### 3. API Integration Issues
```bash
# Test API endpoints
node scripts/test-debug.js run "api-integration"

# Check fetch mocks
node scripts/test-debug.js run "demo analysis"

# Test error handling
node scripts/test-debug.js run "error handling"
```

## Mock Data

### Available Mock Data Sets
The `test-utils/mockData.ts` provides realistic test data:

- `mockFacialAnalysisData`: Facial expression analysis results
- `mockDemoAnalysisData`: Demo diplomatic analysis
- `mockDiplomaticCableData`: Generated diplomatic cable
- `mockTextAnalysisData`: Text sentiment analysis
- `mockAnalysisDataArray`: Complete dataset for testing

### Using Mock Data
```typescript
import { mockDemoAnalysisData } from '@/test-utils/mockData'

test('processes demo analysis correctly', () => {
  render(<Dashboard analysisData={[mockDemoAnalysisData]} meetingId="test" />)
  // Test expectations...
})
```

## Testing Patterns

### 1. Component Rendering Tests
```typescript
test('renders all main sections', () => {
  render(<Dashboard {...defaultProps} />)
  
  expect(screen.getByText('Emotion Score')).toBeInTheDocument()
  expect(screen.getByText('Stress Level')).toBeInTheDocument()
  expect(screen.getByText('Risk Level')).toBeInTheDocument()
})
```

### 2. User Interaction Tests
```typescript
test('opens modal when clicked', async () => {
  render(<Dashboard {...defaultProps} />)
  
  const testButton = screen.getByText('Test Modal')
  fireEvent.click(testButton)
  
  await waitFor(() => {
    expect(screen.getByText(/Details/)).toBeInTheDocument()
  })
})
```

### 3. Data Processing Tests
```typescript
test('processes facial analysis emotions correctly', () => {
  const facialOnlyData = [mockFacialAnalysisData]
  render(<Dashboard analysisData={facialOnlyData} meetingId="test" />)
  
  expect(screen.getByText(/\d+\.\d+/)).toBeInTheDocument()
})
```

### 4. WebSocket Integration Tests
```typescript
test('processes incoming WebSocket messages', async () => {
  render(<HomePage />)
  
  await act(async () => {
    await waitForWebSocketMessage(mockWebSocket, mockDemoAnalysisData)
  })
  
  await waitFor(() => {
    expect(screen.getByText('Demo Analysis')).toBeInTheDocument()
  })
})
```

### 5. API Call Tests
```typescript
test('triggers demo analysis when button clicked', async () => {
  const mockResponse = {
    ok: true,
    json: () => Promise.resolve({ analysis: { test: 'data' } })
  }
  ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

  // Test implementation...
})
```

## Test Utilities

### Custom Render Function
```typescript
import { render } from '@/test-utils/testUtils'

// Provides any necessary providers/context
const { getByText } = render(<Component />)
```

### WebSocket Test Helpers
```typescript
import { 
  waitForWebSocketMessage, 
  triggerWebSocketOpen, 
  triggerWebSocketClose 
} from '@/test-utils/testUtils'

// Simulate WebSocket events in tests
await waitForWebSocketMessage(mockWebSocket, testData)
```

## Environment Setup

### Test Dependencies
- `@testing-library/react`: Component testing utilities
- `@testing-library/jest-dom`: DOM assertion matchers
- `@testing-library/user-event`: User interaction simulation
- `jest`: Test runner and framework
- `jest-environment-jsdom`: Browser-like environment

### Configuration Files
- `jest.config.js`: Jest configuration with Next.js integration
- `jest.setup.js`: Global test setup, mocks, and utilities

## Best Practices

### 1. Test Organization
- Group related tests with `describe` blocks
- Use descriptive test names that explain the expected behavior
- Follow the Arrange-Act-Assert pattern

### 2. Mock Strategy
- Mock external dependencies (fetch, WebSocket, etc.)
- Use realistic mock data that matches API responses
- Reset mocks between tests to avoid interference

### 3. Async Testing
- Use `waitFor` for async operations
- Wrap state updates in `act` when needed
- Test loading states and error conditions

### 4. Coverage Goals
- Aim for >80% code coverage
- Focus on critical paths and user interactions
- Don't neglect edge cases and error scenarios

## Debugging Failed Tests

### 1. Run Single Test
```bash
npm test -- --testNamePattern="specific test name"
```

### 2. Enable Verbose Output
```bash
npm test -- --verbose
```

### 3. Debug with Console Logs
```typescript
test('debug test', () => {
  const { debug } = render(<Component />)
  debug() // Prints DOM tree
  console.log(screen.getByTestId('element').innerHTML)
})
```

### 4. Check Test Output
```bash
# Run with coverage to see which lines aren't tested
npm run test:coverage

# Check console for mock call information
npm test -- --verbose
```

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run Tests
  run: |
    npm ci
    npm run test:coverage
    
- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

## Common Issues and Solutions

### 1. WebSocket Tests Failing
- Ensure WebSocket is properly mocked in `jest.setup.js`
- Use test utilities for WebSocket event simulation
- Check that async operations are properly awaited

### 2. Component Not Rendering
- Verify all required props are provided
- Check for missing mock implementations
- Ensure dynamic imports are mocked correctly

### 3. API Tests Timing Out
- Increase Jest timeout for integration tests
- Use proper async/await patterns
- Mock fetch for unit tests, use real API for integration tests

### 4. Coverage Reports Missing Files
- Check `collectCoverageFrom` patterns in Jest config
- Ensure test files are properly named and located
- Verify that components are actually imported and tested

## Performance Testing

For performance testing of real-time updates:

```typescript
test('handles rapid WebSocket updates', async () => {
  const messages = Array.from({ length: 100 }, (_, i) => ({
    ...mockDemoAnalysisData,
    timestamp: new Date(Date.now() + i * 1000).toISOString()
  }))
  
  for (const message of messages) {
    await waitForWebSocketMessage(mockWebSocket, message)
  }
  
  // Verify UI remains responsive
  expect(screen.getByText('Recent Analysis Activity')).toBeInTheDocument()
})
```