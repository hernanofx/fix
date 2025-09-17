import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const categorySlug = formData.get('categorySlug') as string;

        if (!file || !categorySlug) {
            return NextResponse.json({ error: 'Missing file or category' }, { status: 400 });
        }

        // Convertir archivo a buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Subir a Cloudinary con estructura de carpetas (mantener categorySlug para organización)
        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder: `Wiki/${categorySlug}`,
                    public_id: `${Date.now()}_${file.name.split('.')[0]}`,
                    resource_type: 'auto',
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(buffer);
        });

        return NextResponse.json({
            url: (result as any).secure_url,
            publicId: (result as any).public_id,
        });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const categorySlug = searchParams.get('category');
        const search = searchParams.get('search') || '';

        if (!categorySlug) {
            return NextResponse.json({ error: 'Category required' }, { status: 400 });
        }

        // Buscar imágenes en la carpeta de la categoría
        let expression = `folder:Wiki/${categorySlug}`;
        if (search && search.trim()) {
            expression += ` AND filename:*${search}*`;
        }

        const result = await cloudinary.search
            .expression(expression)
            .sort_by('created_at', 'desc')
            .max_results(50)
            .execute();

        const images = result.resources.map((img: any) => ({
            url: img.secure_url,
            publicId: img.public_id,
            filename: img.filename,
            createdAt: img.created_at,
        }));

        return NextResponse.json(images);
    } catch (error) {
        console.error('Error fetching images:', error);
        return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
    }
}
