'use client'

import { useState, useEffect } from 'react'
import AdminNavigation from '@/components/AdminNavigation'
import { Menu, X } from 'lucide-react'

interface AdminLayoutProps {
    children: React.ReactNode
    title?: string
    subtitle?: string
    showHeader?: boolean
}

export default function AdminLayout({
    children,
    title = "Panel de Administración",
    subtitle,
    showHeader = true
}: AdminLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024)
            if (window.innerWidth >= 1024) {
                setSidebarOpen(false)
            }
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const toggleSidebar = () => {
        if (isMobile) {
            setSidebarOpen(!sidebarOpen)
        } else {
            setSidebarCollapsed(!sidebarCollapsed)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div className="flex">
                {/* Sidebar */}
                <div className={`
                    fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
                    w-80 min-h-screen bg-white border-r border-gray-200 shadow-sm
                    transform transition-transform duration-300 ease-in-out
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
                    ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-80'}
                `}>
                    <div className="p-6">
                        {/* Mobile close button */}
                        <div className="flex justify-end mb-4 lg:hidden">
                            <button
                                onClick={toggleSidebar}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <X className="h-6 w-6 text-gray-600" />
                            </button>
                        </div>

                        {/* Logo and Title */}
                        <div className={`flex items-center space-x-3 mb-8 ${sidebarCollapsed ? 'justify-center' : ''}`}>
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            {!sidebarCollapsed && (
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">Panel Maestro</h1>
                                    <p className="text-gray-600 text-sm">Sistema Multi-tenant</p>
                                </div>
                            )}
                        </div>

                        {/* Navigation */}
                        <AdminNavigation
                            collapsed={sidebarCollapsed}
                            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                        />
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    {/* Mobile header */}
                    <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
                        <button
                            onClick={toggleSidebar}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <Menu className="h-6 w-6 text-gray-600" />
                        </button>
                        {showHeader && (
                            <div className="flex-1 text-center">
                                <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
                                {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
                            </div>
                        )}
                        <div className="w-10" /> {/* Spacer for centering */}
                    </div>

                    {/* Desktop header */}
                    {showHeader && !isMobile && (
                        <div className="bg-white border-b border-gray-200 px-8 py-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                                    {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
                                </div>
                                <div className="flex items-center space-x-4">
                                    {/* Additional header actions can go here */}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Page Content */}
                    <div className="p-4 lg:p-8">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}