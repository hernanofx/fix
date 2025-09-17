'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Upload, X } from 'lucide-react';
import Image from 'next/image';

interface ImageGalleryProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectImage: (url: string) => void;
    categorySlug: string;
}

interface CloudinaryImage {
    url: string;
    publicId: string;
    filename: string;
    createdAt: string;
}

export default function ImageGallery({ isOpen, onClose, onSelectImage, categorySlug }: ImageGalleryProps) {
    const [images, setImages] = useState<CloudinaryImage[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (isOpen && categorySlug) {
            fetchImages();
        }
    }, [isOpen, categorySlug, search]);

    const fetchImages = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/wiki/images?category=${categorySlug}&search=${search}`);
            if (response.ok) {
                const data = await response.json();
                setImages(data);
            }
        } catch (error) {
            console.error('Error fetching images:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('categorySlug', categorySlug);

        try {
            const response = await fetch('/api/wiki/images', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                onSelectImage(data.url);
                onClose();
                fetchImages(); // Refresh gallery
            }
        } catch (error) {
            console.error('Upload error:', error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Galería de Imágenes - {categorySlug}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Search and Upload */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Buscar imágenes..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="image-upload"
                            />
                            <label htmlFor="image-upload">
                                <Button asChild disabled={uploading}>
                                    <span className="cursor-pointer">
                                        <Upload className="w-4 h-4 mr-2" />
                                        {uploading ? 'Subiendo...' : 'Subir Imagen'}
                                    </span>
                                </Button>
                            </label>
                        </div>
                    </div>

                    {/* Image Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="col-span-full flex justify-center items-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : images.length === 0 ? (
                            <div className="col-span-full text-center py-8 text-gray-500">
                                No se encontraron imágenes
                            </div>
                        ) : (
                            images.map((image) => (
                                <div
                                    key={image.publicId}
                                    className="relative group cursor-pointer border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                                    onClick={() => onSelectImage(image.url)}
                                >
                                    <Image
                                        src={image.url}
                                        alt={image.filename}
                                        width={200}
                                        height={150}
                                        className="w-full h-32 object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                                        <Button size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            Insertar
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
