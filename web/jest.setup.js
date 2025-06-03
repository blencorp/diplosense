import '@testing-library/jest-dom'

// Mock next/dynamic
jest.mock('next/dynamic', () => (fn) => {
  const dynamicModule = fn()
  return dynamicModule.default || dynamicModule
})

// Mock recharts components
jest.mock('recharts', () => ({
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
}))

// Mock WebSocket
global.WebSocket = jest.fn(() => ({
  onopen: jest.fn(),
  onclose: jest.fn(),
  onmessage: jest.fn(),
  onerror: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
}))

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    hostname: 'localhost',
    host: 'localhost:3000',
  },
  writable: true,
})