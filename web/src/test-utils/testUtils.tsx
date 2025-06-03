import React from 'react'
import { render, RenderOptions } from '@testing-library/react'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}))

// Custom render function that includes providers if needed
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Helper functions for testing
export const waitForWebSocketMessage = (mockWebSocket: any, message: any) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({ data: JSON.stringify(message) })
      }
      resolve(undefined)
    }, 0)
  })
}

export const triggerWebSocketOpen = (mockWebSocket: any) => {
  if (mockWebSocket.onopen) {
    mockWebSocket.onopen()
  }
}

export const triggerWebSocketClose = (mockWebSocket: any) => {
  if (mockWebSocket.onclose) {
    mockWebSocket.onclose()
  }
}