'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Home, Settings, Plus, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/Navigation';
import { useState } from 'react';

interface WikiLayoutProps {
    children: ReactNode;
}

export default function WikiLayout({ children }: WikiLayoutProps) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const isActive = (path: string) => {
        if (path === '/wiki') {
            return pathname === '/wiki';
        }
        return pathname?.startsWith(path);
    };

    const navigation = [
        {
            name: 'Inicio',
            href: '/wiki',
            icon: Home,
            description: 'Página principal de la wiki'
        },
        {
            name: 'Administrar',
            href: '/wiki/admin',
            icon: Settings,
            description: 'Panel de administración de WikiPix',
            adminOnly: true
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar Navigation */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0 lg:static lg:inset-0
            `}>
                <div className="flex flex-col h-full">
                    {/* Sidebar Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <Link href="/wiki" className="flex items-center space-x-2">
                            <BookOpen className="w-6 h-6 text-blue-600" />
                            <span className="font-semibold text-gray-900">Wiki</span>
                        </Link>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Main Navigation */}
                    <div className="flex-1 overflow-y-auto">
                        <Navigation collapsed={false} />
                    </div>

                    {/* Wiki Navigation */}
                    <div className="border-t border-gray-200 p-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">WikiPix</h3>
                        <nav className="space-y-1">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);

                                return (
                                    <Link key={item.name} href={item.href}>
                                        <div className={`
                                            flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors
                                            ${active
                                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }
                                        `}>
                                            <Icon className="w-4 h-4" />
                                            <span>{item.name}</span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            </div>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className="flex-1 lg:ml-0">
                {/* Top Header */}
                <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
                    <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center space-x-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden"
                            >
                                <Menu className="w-4 h-4" />
                            </Button>

                            {/* Breadcrumb */}
                            <nav className="flex items-center space-x-2 text-sm text-gray-600">
                                <Link href="/wiki" className="hover:text-blue-600 flex items-center space-x-1">
                                    <BookOpen className="w-4 h-4" />
                                    <span>WikiPix</span>
                                </Link>
                                {pathname && pathname !== '/wiki' && (
                                    <>
                                        <span className="text-gray-400">/</span>
                                        {pathname.includes('/admin') && (
                                            <span className="text-gray-900 font-medium">Administración</span>
                                        )}
                                        {pathname.includes('/wiki/') && !pathname.includes('/admin') && (
                                            <span className="text-gray-900 font-medium">
                                                {pathname.split('/').filter(Boolean).slice(1).join(' / ')}
                                            </span>
                                        )}
                                    </>
                                )}
                            </nav>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Link href="/dashboard">
                                <Button variant="outline" size="sm" className="hidden sm:flex">
                                    ← Volver al Sistema
                                </Button>
                                <Button variant="outline" size="sm" className="sm:hidden">
                                    ← Sistema
                                </Button>
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 lg:p-6">
                    {children}
                </main>

                {/* Footer */}
                <footer className="bg-white border-t border-gray-200 mt-16">
                    <div className="px-4 lg:px-6 py-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                            <div className="text-sm text-gray-500 text-center sm:text-left">
                                <p>© 2025 Pix ERP - WikiPix</p>
                                <p>Documentación interna del sistema</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <Badge variant="secondary" className="text-xs">
                                    v1.0.0
                                </Badge>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
