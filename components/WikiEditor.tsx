'use client';

import { useState, useRef, useEffect } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Image, Youtube, Bold, Italic, Link } from 'lucide-react';
import ImageGallery from './modals/ImageGallery';
import YouTubeEmbed from './modals/YouTubeEmbed';

interface WikiEditorProps {
    initialTitle?: string;
    initialContent?: string;
    initialCategoryId?: string;
    categories: Array<{ id: string; name: string; slug?: string }>;
    onSave: (data: { title: string; content: string; categoryId: string }) => void;
    onCancel: () => void;
    categorySlug?: string;
}

export default function WikiEditor({
    initialTitle = '',
    initialContent = '',
    initialCategoryId = '',
    categories,
    onSave,
    onCancel,
    categorySlug = ''
}: WikiEditorProps) {
    const [title, setTitle] = useState(initialTitle);
    const [content, setContent] = useState(initialContent);
    const [categoryId, setCategoryId] = useState(initialCategoryId);
    const [showImageGallery, setShowImageGallery] = useState(false);
    const [showYouTubeEmbed, setShowYouTubeEmbed] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    // Try to capture the underlying textarea used by MDEditor once it's mounted.
    useEffect(() => {
        const tryFind = () => {
            const el = document.querySelector('.w-md-editor-text-pre') as HTMLTextAreaElement | null;
            if (el) textareaRef.current = el;
        };
        // Try immediately and again on next frame in case editor mounts slightly later.
        tryFind();
        const id = requestAnimationFrame(tryFind);
        return () => cancelAnimationFrame(id);
    }, []);

    // Insert text at the current selection. If `atLineStart` is true,
    // the prefix will be inserted at the start of the current line.
    const insertText = (before: string, after: string = '', atLineStart = false) => {
        const textarea = textareaRef.current || (document.querySelector('.w-md-editor-text-pre') as HTMLTextAreaElement | null);
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        if (atLineStart) {
            // find start of current line
            const lineStart = content.lastIndexOf('\n', start - 1) + 1;
            const selectedText = content.substring(lineStart, end);
            const newContent = content.substring(0, lineStart) + before + selectedText + after + content.substring(end);
            setContent(newContent);
            // move caret after the inserted prefix
            requestAnimationFrame(() => {
                const pos = lineStart + before.length + (end - lineStart);
                textarea.focus();
                textarea.setSelectionRange(pos, pos);
            });
        } else {
            const selectedText = content.substring(start, end);
            const newContent = content.substring(0, start) + before + selectedText + after + content.substring(end);
            setContent(newContent);
            requestAnimationFrame(() => {
                const pos = start + before.length + (end - start) + after.length;
                textarea.focus();
                textarea.setSelectionRange(pos, pos);
            });
        }
    };

    const handleInsertImage = (url: string) => {
        insertText(`![Imagen](${url})`, '');
        setShowImageGallery(false);
    };

    const handleInsertYouTube = (embedCode: string) => {
        insertText(embedCode, '\n\n');
        setShowYouTubeEmbed(false);
    };

    const handleSave = () => {
        if (!title.trim() || !content.trim() || !categoryId) {
            alert('Por favor completa todos los campos');
            return;
        }
        onSave({ title, content, categoryId });
    };

    const currentCategorySlug = categorySlug || categories.find(c => c.id === categoryId)?.slug || '';

    return (
        <div className="space-y-6">
            {/* Title Input */}
            <div>
                <label className="block text-sm font-medium mb-2">Título</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Título de la página"
                />
            </div>

            {/* Category Select */}
            <div>
                <label className="block text-sm font-medium mb-2">Categoría</label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                                {category.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Rich Text Toolbar */}
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border border-gray-200 rounded-t-md">
                <Button variant="outline" size="sm" onClick={() => insertText('**', '**')} title="Negrita">
                    <Bold className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => insertText('*', '*')} title="Cursiva">
                    <Italic className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => insertText('[', '](url)')} title="Enlace">
                    <Link className="w-4 h-4" />
                </Button>

                {/* Headings */}
                <div className="ml-2 flex items-center space-x-1">
                    <Button variant="outline" size="sm" onClick={() => insertText('# ', '', true)} title="H1">H1</Button>
                    <Button variant="outline" size="sm" onClick={() => insertText('## ', '', true)} title="H2">H2</Button>
                    <Button variant="outline" size="sm" onClick={() => insertText('### ', '', true)} title="H3">H3</Button>
                </div>

                {/* Lists */}
                <div className="ml-2 flex items-center space-x-1">
                    <Button variant="outline" size="sm" onClick={() => insertText('- ', '', true)} title="Lista con viñetas">•</Button>
                    <Button variant="outline" size="sm" onClick={() => insertText('1. ', '', true)} title="Lista numerada">1.</Button>
                </div>
                <div className="w-px h-6 bg-gray-300 mx-2" />
                <Button variant="outline" size="sm" onClick={() => setShowImageGallery(true)} title="Insertar Imagen" disabled={!currentCategorySlug}>
                    <Image className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowYouTubeEmbed(true)} title="Insertar Video de YouTube">
                    <Youtube className="w-4 h-4" />
                </Button>
            </div>

            {/* Markdown Editor */}
            <div>
                <MDEditor
                    value={content}
                    onChange={(val) => setContent(val || '')}
                    preview="edit"
                    hideToolbar={true}
                    visibleDragbar={false}
                    data-color-mode="light"
                    className="border border-gray-200 rounded-b-md"
                />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button onClick={handleSave}>
                    Guardar
                </Button>
            </div>

            {/* Modals */}
            <ImageGallery
                isOpen={showImageGallery}
                onClose={() => setShowImageGallery(false)}
                onSelectImage={handleInsertImage}
                categorySlug={currentCategorySlug}
            />

            <YouTubeEmbed
                isOpen={showYouTubeEmbed}
                onClose={() => setShowYouTubeEmbed(false)}
                onInsertEmbed={handleInsertYouTube}
            />
        </div>
    );
}
