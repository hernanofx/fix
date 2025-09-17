'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Folder, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CategoryLayoutProps {
    children: ReactNode;
}

export default function CategoryLayout({ children }: CategoryLayoutProps) {
    const params = useParams();
    const categorySlug = params.category as string;

    return (
        <div className="space-y-6">
            {/* Category Header */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-4">
                        <Link href="/wiki">
                            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                                <ArrowLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">Volver a Wiki</span>
                            </Button>
                        </Link>
                        <div className="flex items-center space-x-2">
                            <Folder className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-semibold text-gray-900">
                                {categorySlug?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="flex items-center space-x-1">
                            <FileText className="w-3 h-3" />
                            <span>Páginas</span>
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Content */}
            {children}
        </div>
    );
}
