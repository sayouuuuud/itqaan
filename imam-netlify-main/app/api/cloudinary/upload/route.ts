import { NextRequest, NextResponse } from 'next/server'
import { uploadToCloudinary, splitAndUploadAudio } from '@/lib/storage/cloudinary'

export const runtime = 'nodejs'

// Allow large file uploads
export const maxDuration = 300 // 5 minutes

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const folder = formData.get('folder') as string | null
        const explicitResourceType = formData.get('resourceType') as 'auto' | 'image' | 'video' | 'raw' | null
        const splitAudio = formData.get('splitAudio') === 'true'

        if (!file) {
            return NextResponse.json({ error: 'الملف مطلوب' }, { status: 400 })
        }

        if (!folder) {
            return NextResponse.json({ error: 'المجلد مطلوب' }, { status: 400 })
        }

        console.log('📤 Cloudinary upload request:', {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            folder,
            explicitResourceType,
            splitAudio,
        })

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const TEN_MB = 10 * 1024 * 1024
        const HUNDRED_MB = 100 * 1024 * 1024

        // Check file size limit
        if (buffer.length > HUNDRED_MB) {
            return NextResponse.json({
                success: false,
                error: 'الملف كبير جداً (أكثر من 100MB)'
            }, { status: 400 })
        }

        // Handle audio splitting for streaming
        const isAudio = file.type.startsWith('audio/') ||
            file.name.toLowerCase().endsWith('.mp3') ||
            file.name.toLowerCase().endsWith('.m4a') ||
            file.name.toLowerCase().endsWith('.wav')

        if (splitAudio && isAudio) {
            console.log('🎵 Using split upload for audio streaming...')

            const splitResult = await splitAndUploadAudio({
                file: buffer,
                folder,
                fileName: file.name,
            })

            return NextResponse.json({
                success: true,
                url: splitResult.splitUrl,
                isSplit: splitResult.totalChunks > 1,
                totalChunks: splitResult.totalChunks,
                totalSize: splitResult.totalSize,
                format: splitResult.originalFormat,
                duration: splitResult.duration,
            })
        }

        // Determine resource type for regular upload
        let resourceType: 'auto' | 'image' | 'video' | 'raw' = explicitResourceType || 'raw'

        if (!explicitResourceType) {
            if (file.type.startsWith('image/')) {
                resourceType = 'image'
            } else if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
                resourceType = 'video'
            }
        }

        const result = await uploadToCloudinary({
            file: buffer,
            folder,
            resourceType,
            fileName: file.name,
        })

        return NextResponse.json({
            success: true,
            url: result.secureUrl,
            publicId: result.publicId,
            format: result.format,
            bytes: result.bytes,
            width: result.width,
            height: result.height,
            duration: result.duration,
        })
    } catch (error: any) {
        console.error('❌ Cloudinary upload error:', error)
        return NextResponse.json(
            { error: error.message || 'فشل رفع الملف' },
            { status: 500 }
        )
    }
}
