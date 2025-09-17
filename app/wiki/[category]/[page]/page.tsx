'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import WikiViewer from '@/components/WikiViewer';

interface WikiPage {
    id: string;
    title: string;
    content: string;
    category: {
        name: string;
        slug: string;
    };
    createdAt: string;
}

export default function WikiPageView() {
    const { data: session, status } = useSession();
    const params = useParams();
    const categorySlug = params.category as string;
    const pageSlug = params.page as string;
    const [page, setPage] = useState<WikiPage | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            window.location.href = '/login';
            return;
        }
        fetchPage();
    }, [categorySlug, pageSlug, session, status]);

    const fetchPage = async () => {
        try {
            // First get all pages and find the matching one
            const response = await fetch('/api/wiki/pages');
            if (response.ok) {
                const allPages = await response.json();
                const foundPage = allPages.find(
                    (p: any) => p.category.slug === categorySlug && p.slug === pageSlug
                );
                setPage(foundPage || null);
            }
        } catch (error) {
            console.error('Error fetching page:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Cargando...</div>;
    }

    if (!page) {
        return (
            <div className="space-y-6">
                <div className="text-center py-12">
                    <p className="text-gray-500">Página no encontrada.</p>
                    <Link href="/wiki" className="text-blue-600 hover:text-blue-800 inline-flex items-center">
                        ← Volver a Wiki
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-4 sm:space-y-0">
                <div>
                    <Link href={`/wiki/${categorySlug}`} className="text-blue-600 hover:text-blue-800 inline-flex items-center text-sm mb-2">
                        ← {page.category.name}
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-bold">{page.title}</h1>
                </div>
                {session?.user?.role === 'ADMIN' && (
                    <Link href="/wiki/admin">
                        <Button className="w-full sm:w-auto">Editar Página</Button>
                    </Link>
                )}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <WikiViewer content={page.content} />
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-500">
                    Última actualización: {new Date(page.createdAt).toLocaleDateString('es-ES')}
                </p>
            </div>
        </div>
    );
}
