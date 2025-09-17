'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Youtube } from 'lucide-react';

interface YouTubeEmbedProps {
    isOpen: boolean;
    onClose: () => void;
    onInsertEmbed: (embedCode: string) => void;
}

export default function YouTubeEmbed({ isOpen, onClose, onInsertEmbed }: YouTubeEmbedProps) {
    const [url, setUrl] = useState('');
    const [preview, setPreview] = useState<string | null>(null);

    const extractVideoId = (url: string) => {
        const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        return match ? match[1] : null;
    };

    const handleUrlChange = (value: string) => {
        setUrl(value);
        const videoId = extractVideoId(value);
        if (videoId) {
            setPreview(`https://www.youtube.com/embed/${videoId}`);
        } else {
            setPreview(null);
        }
    };

    const handleInsert = () => {
        const videoId = extractVideoId(url);
        if (videoId) {
            const embedCode = `[![YouTube Video](https://img.youtube.com/vi/${videoId}/0.jpg)](https://www.youtube.com/watch?v=${videoId})`;
            onInsertEmbed(embedCode);
            onClose();
            setUrl('');
            setPreview(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        <Youtube className="w-5 h-5 mr-2 text-red-600" />
                        Insertar Video de YouTube
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">URL del Video</label>
                        <Input
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={url}
                            onChange={(e) => handleUrlChange(e.target.value)}
                        />
                    </div>

                    {preview && (
                        <div className="space-y-2">
                            <label className="block text-sm font-medium">Preview</label>
                            <div className="aspect-video">
                                <iframe
                                    src={preview}
                                    className="w-full h-full rounded-lg"
                                    allowFullScreen
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button onClick={handleInsert} disabled={!preview}>
                            Insertar Video
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
