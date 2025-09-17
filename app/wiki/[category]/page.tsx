'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WikiPage {
    id: string;
    title: string;
    slug: string;
    content: string;
    createdAt: string;
}

export default function CategoryPage() {
    const { data: session, status } = useSession();
    const params = useParams();
    const categorySlug = params.category as string;
    const [pages, setPages] = useState<WikiPage[]>([]);
    const [categoryName, setCategoryName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            window.location.href = '/login';
            return;
        }
        fetchPages();
    }, [categorySlug, session, status]);

    const fetchPages = async () => {
        try {
            const response = await fetch('/api/wiki/pages');
            if (response.ok) {
                const allPages = await response.json();
                // Filter pages by category slug
                const categoryPages = allPages.filter(
                    (page: any) => page.category.slug === categorySlug
                );
                setPages(categoryPages);
                if (categoryPages.length > 0) {
                    setCategoryName(categoryPages[0].category.name);
                }
            }
        } catch (error) {
            console.error('Error fetching pages:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Cargando...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-4 sm:space-y-0">
                <div>
                    <Link href="/wiki" className="text-blue-600 hover:text-blue-800 inline-flex items-center text-sm mb-2">
                        ← Volver a Wiki
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-bold">{categoryName}</h1>
                </div>
                {session?.user?.role === 'ADMIN' && (
                    <Link href="/wiki/admin">
                        <Button className="w-full sm:w-auto">Administrar Wiki</Button>
                    </Link>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pages.map((page) => (
                    <Card key={page.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle className="text-lg sm:text-xl">
                                <Link
                                    href={`/wiki/${categorySlug}/${page.slug}`}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    {page.title}
                                </Link>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500">
                                Creado el {new Date(page.createdAt).toLocaleDateString('es-ES')}
                            </p>
                            <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                                {page.content.substring(0, 150)}...
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {pages.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500">No hay páginas en esta categoría.</p>
                    {session?.user?.role === 'ADMIN' && (
                        <p className="text-sm text-gray-400 mt-2">
                            Crea la primera página desde el panel de administración.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
