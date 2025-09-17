'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Folder, FileText, Plus, Edit, Trash2 } from 'lucide-react';
import WikiEditor from '@/components/WikiEditor';

interface WikiCategory {
    id: string;
    name: string;
    slug: string;
    description?: string;
    _count: { pages: number };
    createdAt: string;
}

interface WikiPage {
    id: string;
    title: string;
    slug: string;
    content: string;
    category: { name: string; slug: string };
    categoryId?: string;
    createdAt: string;
    updatedAt: string;
}

export default function WikiAdminPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [categories, setCategories] = useState<WikiCategory[]>([]);
    const [pages, setPages] = useState<WikiPage[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<'categories' | 'pages'>('categories');

    // Form states
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [showPageForm, setShowPageForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState<WikiCategory | null>(null);
    const [editingPage, setEditingPage] = useState<WikiPage | null>(null);

    const [categoryForm, setCategoryForm] = useState({
        name: '',
        slug: '',
        description: ''
    });

    const [pageForm, setPageForm] = useState({
        title: '',
        slug: '',
        content: '',
        categoryId: ''
    });

    useEffect(() => {
        if (session?.user?.role !== 'ADMIN') {
            router.push('/wiki');
            return;
        }
        fetchData();
    }, [session]);

    const fetchData = async () => {
        try {
            const [categoriesRes, pagesRes] = await Promise.all([
                fetch('/api/wiki/categories'),
                fetch('/api/wiki/pages')
            ]);

            if (categoriesRes.ok) {
                const categoriesData = await categoriesRes.json();
                setCategories(categoriesData);
            }

            if (pagesRes.ok) {
                const pagesData = await pagesRes.json();
                setPages(pagesData);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/wiki/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(categoryForm)
            });

            if (response.ok) {
                resetCategoryForm();
                fetchData();
            }
        } catch (error) {
            console.error('Error creating category:', error);
        }
    };

    const handleUpdateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCategory) return;

        try {
            const response = await fetch(`/api/wiki/categories/${editingCategory.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(categoryForm)
            });

            if (response.ok) {
                resetCategoryForm();
                fetchData();
            }
        } catch (error) {
            console.error('Error updating category:', error);
        }
    };

    const handleDeleteCategory = async (categoryId: string) => {
        try {
            const response = await fetch(`/api/wiki/categories/${categoryId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                fetchData();
            }
        } catch (error) {
            console.error('Error deleting category:', error);
        }
    };

    const handleCreatePage = async (data: { title: string; content: string; categoryId: string }) => {
        try {
            const category = categories.find(c => c.id === data.categoryId);
            if (!category) return;

            const response = await fetch('/api/wiki/pages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: data.title,
                    slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                    content: data.content,
                    categoryId: data.categoryId
                })
            });

            if (response.ok) {
                resetPageForm();
                fetchData();
            }
        } catch (error) {
            console.error('Error creating page:', error);
        }
    };

    const handleUpdatePage = async (data: { title: string; content: string; categoryId: string }) => {
        if (!editingPage) return;

        try {
            const category = categories.find(c => c.id === data.categoryId);
            if (!category) return;

            const response = await fetch(`/api/wiki/pages/${editingPage.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: data.title,
                    slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                    content: data.content,
                    categoryId: data.categoryId
                })
            });

            if (response.ok) {
                resetPageForm();
                fetchData();
            }
        } catch (error) {
            console.error('Error updating page:', error);
        }
    };

    const handleDeletePage = async (pageId: string) => {
        try {
            const response = await fetch(`/api/wiki/pages/${pageId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                fetchData();
            }
        } catch (error) {
            console.error('Error deleting page:', error);
        }
    };

    const resetCategoryForm = () => {
        setCategoryForm({ name: '', slug: '', description: '' });
        setShowCategoryForm(false);
        setEditingCategory(null);
    };

    const resetPageForm = () => {
        setPageForm({ title: '', slug: '', content: '', categoryId: '' });
        setShowPageForm(false);
        setEditingPage(null);
    };

    const startEditCategory = (category: WikiCategory) => {
        setEditingCategory(category);
        setCategoryForm({
            name: category.name,
            slug: category.slug,
            description: category.description || ''
        });
        setShowCategoryForm(true);
    };

    const startEditPage = (page: WikiPage) => {
        const categoryId = categories.find(c => c.slug === page.category.slug)?.id || '';
        setEditingPage({ ...page, categoryId });
        setPageForm({
            title: page.title,
            slug: page.slug,
            content: page.content,
            categoryId: categoryId
        });
        setShowPageForm(true);
    };

    const totalPages = pages.length;
    const totalCategories = categories.length;
    const recentPages = pages.slice(0, 5);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Panel de Administración WikiPix</h1>
                    <p className="text-gray-600 mt-1 sm:mt-2">Gestiona categorías y páginas de WikiPix</p>
                </div>
                <Link href="/wiki">
                    <Button variant="outline" className="w-full sm:w-auto">
                        <Eye className="w-4 h-4 mr-2" />
                        Ver WikiPix
                    </Button>
                </Link>
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <Button
                    variant={activeSection === 'categories' ? 'default' : 'outline'}
                    onClick={() => setActiveSection('categories')}
                    className="flex items-center justify-center space-x-2"
                >
                    <Folder className="w-4 h-4" />
                    <span>Categorías</span>
                </Button>
                <Button
                    variant={activeSection === 'pages' ? 'default' : 'outline'}
                    onClick={() => setActiveSection('pages')}
                    className="flex items-center justify-center space-x-2"
                >
                    <FileText className="w-4 h-4" />
                    <span>Páginas</span>
                </Button>
            </div>

            {activeSection === 'categories' && (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                        <h2 className="text-xl sm:text-2xl font-bold">Categorías</h2>
                        <Button onClick={() => setShowCategoryForm(true)} className="w-full sm:w-auto">
                            <Plus className="w-4 h-4 mr-2" />
                            Nueva Categoría
                        </Button>
                    </div>

                    {/* Category Form */}
                    {showCategoryForm && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg sm:text-xl">
                                    {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Nombre</label>
                                            <Input
                                                placeholder="Nombre de la categoría"
                                                value={categoryForm.name}
                                                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Slug</label>
                                            <Input
                                                placeholder="flujos-proyectos"
                                                value={categoryForm.slug}
                                                onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Descripción</label>
                                        <Textarea
                                            placeholder="Descripción de la categoría"
                                            value={categoryForm.description}
                                            onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                            rows={3}
                                        />
                                    </div>
                                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                                        <Button type="submit" className="w-full sm:w-auto">
                                            {editingCategory ? 'Actualizar' : 'Crear'} Categoría
                                        </Button>
                                        <Button type="button" variant="outline" onClick={resetCategoryForm} className="w-full sm:w-auto">
                                            Cancelar
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {/* Categories List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categories.map((category) => (
                            <Card key={category.id}>
                                <CardHeader>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                                        <CardTitle className="text-lg">{category.name}</CardTitle>
                                        <Badge variant="secondary">{category._count.pages}</Badge>
                                    </div>
                                    <CardDescription className="text-sm">{category.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => startEditCategory(category)}
                                            className="flex-1"
                                        >
                                            <Edit className="w-4 h-4 mr-2" />
                                            Editar
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDeleteCategory(category.id)}
                                            className="flex-1"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Eliminar
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {activeSection === 'pages' && (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                        <h2 className="text-xl sm:text-2xl font-bold">Páginas</h2>
                        <Button onClick={() => setShowPageForm(true)} className="w-full sm:w-auto">
                            <Plus className="w-4 h-4 mr-2" />
                            Nueva Página
                        </Button>
                    </div>

                    {/* Page Form */}
                    {showPageForm && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg sm:text-xl">
                                    {editingPage ? 'Editar Página' : 'Nueva Página'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <WikiEditor
                                    initialTitle={editingPage?.title || ''}
                                    initialContent={editingPage?.content || ''}
                                    initialCategoryId={editingPage?.categoryId || pageForm.categoryId}
                                    categories={categories}
                                    categorySlug={editingPage?.category?.slug || categories.find(c => c.id === pageForm.categoryId)?.slug || ''}
                                    onSave={editingPage ? handleUpdatePage : handleCreatePage}
                                    onCancel={() => {
                                        setShowPageForm(false);
                                        setEditingPage(null);
                                        resetPageForm();
                                    }}
                                />
                            </CardContent>
                        </Card>
                    )}

                    {/* Pages List */}
                    <div className="space-y-4">
                        {pages.map((page) => (
                            <Card key={page.id}>
                                <CardContent className="pt-6">
                                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start space-y-4 lg:space-y-0">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg">{page.title}</h3>
                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                <Badge variant="outline">{page.category.name}</Badge>
                                                <span className="text-sm text-gray-500">
                                                    Creado: {new Date(page.createdAt).toLocaleDateString('es-ES')}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                                {page.content.substring(0, 200)}...
                                            </p>
                                        </div>
                                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 lg:flex-col lg:space-y-2 lg:space-x-0 lg:ml-4">
                                            <Link href={`/wiki/${page.category.slug}/${page.slug}`}>
                                                <Button variant="outline" size="sm" className="w-full">
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Ver
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => startEditPage(page)}
                                                className="w-full"
                                            >
                                                <Edit className="w-4 h-4 mr-2" />
                                                Editar
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDeletePage(page.id)}
                                                className="w-full"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Eliminar
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
