'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WikiCategory {
    id: string;
    name: string;
    slug: string;
    description?: string;
    pages: WikiPage[];
    _count: { pages: number };
}

interface WikiPage {
    id: string;
    title: string;
    slug: string;
    category: { name: string };
}

export default function WikiPage() {
    const { data: session, status } = useSession();
    const [categories, setCategories] = useState<WikiCategory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            // Redirect to login if not authenticated
            window.location.href = '/login';
            return;
        }
        fetchCategories();
    }, [session, status]);

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/wiki/categories');
            if (response.ok) {
                const data = await response.json();
                setCategories(data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Cargando...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                <h1 className="text-2xl sm:text-3xl font-bold">WikiPix</h1>
                {session?.user?.role === 'ADMIN' && (
                    <Link href="/wiki/admin">
                        <Button className="w-full sm:w-auto">Administrar WikiPix</Button>
                    </Link>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                    <Card key={category.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle className="text-lg sm:text-xl">{category.name}</CardTitle>
                            {category.description && (
                                <p className="text-sm text-gray-600">{category.description}</p>
                            )}
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500 mb-4">
                                {category._count.pages} página{category._count.pages !== 1 ? 's' : ''}
                            </p>
                            <div className="space-y-2">
                                {category.pages.slice(0, 3).map((page) => (
                                    <Link
                                        key={page.id}
                                        href={`/wiki/${category.slug}/${page.slug}`}
                                        className="block text-blue-600 hover:text-blue-800 text-sm sm:text-base"
                                    >
                                        {page.title}
                                    </Link>
                                ))}
                                {category.pages.length > 3 && (
                                    <Link
                                        href={`/wiki/${category.slug}`}
                                        className="text-sm text-gray-500 hover:text-gray-700 inline-block"
                                    >
                                        Ver todas las páginas...
                                    </Link>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {categories.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500">No hay categorías disponibles.</p>
                    {session?.user?.role === 'ADMIN' && (
                        <p className="text-sm text-gray-400 mt-2">
                            Crea la primera categoría desde el panel de administración.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
