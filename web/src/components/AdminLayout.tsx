'use client'

import React, { useState, useEffect } from 'react'
import { Shield, LogOut, Home } from 'lucide-react'
import AdminLogin from './AdminLogin'

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title = 'Admin Panel' }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check if admin is already authenticated
    const adminAuth = sessionStorage.getItem('diplosense-admin')
    if (adminAuth === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('diplosense-admin')
    setIsAuthenticated(false)
  }

  // Show loading state during SSR
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Admin Panel...</p>
        </div>
      </div>
    )
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />
  }

  // Show admin interface if authenticated
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">DiploSense {title}</h1>
                <p className="text-sm text-gray-600">Administrative Interface</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <Home className="h-4 w-4" />
                <span className="text-sm">Dashboard</span>
              </a>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Authenticated as Administrator
              </span>
            </div>
          </div>
        </div>
        {children}
      </main>
    </div>
  )
}

export default AdminLayout