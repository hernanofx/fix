'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, FileText, Edit, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageLayoutProps {
    children: ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
    const params = useParams();
    const categorySlug = params.category as string;
    const pageSlug = params.page as string;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                        <Link href={`/wiki/${categorySlug}`}>
                            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                                <ArrowLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">Volver a Categoría</span>
                            </Button>
                        </Link>
                        <div className="flex items-center space-x-2">
                            <FileText className="w-5 h-5 text-green-600" />
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {pageSlug?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Categoría: {categorySlug?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" className="flex items-center space-x-2">
                            <Share2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Compartir</span>
                        </Button>
                        <Button variant="outline" size="sm" className="flex items-center space-x-2">
                            <Edit className="w-4 h-4" />
                            <span className="hidden sm:inline">Editar</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {children}
        </div>
    );
}
