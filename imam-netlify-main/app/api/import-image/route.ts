import { NextResponse } from 'next/server';
import { UTApi } from 'uploadthing/server';

const utapi = new UTApi();

export async function POST(req: Request) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json(
                { success: false, error: 'URL is required' },
                { status: 400 }
            );
        }

        // Fetch the image
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        const blob = await response.blob();
        const contentType = response.headers.get('content-type');

        // Basic validation
        if (!contentType?.startsWith('image/')) {
            return NextResponse.json(
                { success: false, error: 'URL must point to an image' },
                { status: 400 }
            );
        }

        // Convert blob to File object (required by UploadThing)
        const filename = url.split('/').pop()?.split('?')[0] || `imported-image-${Date.now()}`;
        const file = new File([blob], filename, { type: contentType });

        // Upload to UploadThing
        const uploadResponse = await utapi.uploadFiles(file);

        if (uploadResponse.error) {
            throw new Error(uploadResponse.error.message);
        }

        return NextResponse.json({
            success: true,
            url: uploadResponse.data.url
        });

    } catch (error: any) {
        console.error('Image import error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to import image' },
            { status: 500 }
        );
    }
}
