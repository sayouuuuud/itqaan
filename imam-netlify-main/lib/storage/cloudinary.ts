const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET

export interface CloudinaryUploadOptions {
    file: Buffer | Blob | string
    folder: string
    resourceType?: 'auto' | 'image' | 'video' | 'raw'
    fileName?: string
}

export interface CloudinaryUploadResult {
    url: string
    secureUrl: string
    publicId: string
    format: string
    bytes: number
    width?: number
    height?: number
    duration?: number
}

async function generateSignature(params: Record<string, string>, apiSecret: string) {
    const sortedKeys = Object.keys(params).sort()
    const stringToSign = sortedKeys.map(key => `${key}=${params[key]}`).join('&') + apiSecret
    const msgBuffer = new TextEncoder().encode(stringToSign)
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Upload file to Cloudinary (Edge Compatible)
 */
export async function uploadToCloudinary({
    file,
    folder,
    resourceType = 'auto',
    fileName,
}: CloudinaryUploadOptions): Promise<CloudinaryUploadResult> {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        throw new Error("Missing Cloudinary credentials")
    }

    const timestamp = Math.round(Date.now() / 1000).toString()
    const params: Record<string, string> = {
        folder: `imam/${folder}`,
        timestamp,
        unique_filename: 'true',
    }

    if (fileName) {
        params.public_id = fileName.replace(/\.[^/.]+$/, '')
        params.use_filename = 'true'
    }

    const signature = await generateSignature(params, CLOUDINARY_API_SECRET)

    const formData = new FormData()
    formData.append('api_key', CLOUDINARY_API_KEY)
    formData.append('timestamp', timestamp)
    formData.append('folder', params.folder)
    formData.append('unique_filename', params.unique_filename)
    if (params.public_id) formData.append('public_id', params.public_id)
    if (params.use_filename) formData.append('use_filename', params.use_filename)
    formData.append('signature', signature)

    if (typeof file === 'string' && (file.startsWith('http') || file.startsWith('data:'))) {
        formData.append('file', file)
    } else if (file instanceof Blob) {
        formData.append('file', file)
    } else if (file instanceof Buffer) {
        formData.append('file', new Blob([file]))
    } else {
        throw new Error("Invalid file format")
    }

    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`

    const response = await fetch(url, {
        method: 'POST',
        body: formData
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Cloudinary upload failed')
    }

    const result = await response.json()

    return {
        url: result.url,
        secureUrl: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        duration: result.duration,
    }
}

/**
 * Delete file from Cloudinary (Edge Compatible)
 */
export async function deleteFromCloudinary(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'raw'
): Promise<{ success: boolean; error?: string }> {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        return { success: false, error: "Missing Cloudinary credentials" }
    }

    const timestamp = Math.round(Date.now() / 1000).toString()
    const params = {
        public_id: publicId,
        timestamp,
    }
    const signature = await generateSignature(params, CLOUDINARY_API_SECRET)

    const formData = new FormData()
    formData.append('api_key', CLOUDINARY_API_KEY)
    formData.append('public_id', publicId)
    formData.append('timestamp', timestamp)
    formData.append('signature', signature)

    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/destroy`

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        })

        const result = await response.json()

        if (result.result === 'ok' || result.result === 'not found') {
            return { success: true }
        }

        return { success: false, error: result.result }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Helper: Extract publicId
 */
export function extractPublicIdFromUrl(url: string): { publicId: string | null; resourceType: 'image' | 'video' | 'raw' } {
    if (!url || !url.includes('cloudinary.com')) {
        return { publicId: null, resourceType: 'raw' }
    }

    try {
        let resourceType: 'image' | 'video' | 'raw' = 'raw'
        if (url.includes('/image/upload/')) {
            resourceType = 'image'
        } else if (url.includes('/video/upload/')) {
            resourceType = 'video'
        } else if (url.includes('/raw/upload/')) {
            resourceType = 'raw'
        }

        const versionMatch = url.match(/\/v\d+\/(.+?)(?:\.[^.\/]+)?$/)
        if (versionMatch) {
            return { publicId: versionMatch[1], resourceType }
        }

        const uploadMatch = url.match(/\/upload\/(.+?)(?:\.[^.\/]+)?$/)
        if (uploadMatch) {
            return { publicId: uploadMatch[1], resourceType }
        }

        return { publicId: null, resourceType }
    } catch (error) {
        return { publicId: null, resourceType: 'raw' }
    }
}

export async function deleteFromCloudinaryByUrl(url: string): Promise<{ success: boolean; error?: string }> {
    const { publicId, resourceType } = extractPublicIdFromUrl(url)
    if (!publicId) return { success: false, error: 'Could not extract publicId' }
    return deleteFromCloudinary(publicId, resourceType)
}

/**
 * Get Cloudinary usage status
 */
export async function getCloudinaryUsage() {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        throw new Error("Missing Cloudinary credentials")
    }

    const auth = btoa(`${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}`)
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/usage`

    const response = await fetch(url, {
        headers: {
            'Authorization': `Basic ${auth}`
        }
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to fetch usage')
    }

    return response.json()
}

/**
 * Get Cloudinary URL (Edge compatible version without SDK)
 */
export function getCloudinaryUrl(
    publicId: string,
    options?: {
        resourceType?: 'image' | 'video' | 'raw'
        transformation?: string
    }
): string {
    const { resourceType = 'image', transformation } = options || {}
    const transPart = transformation ? `${transformation}/` : ''
    // res.cloudinary.com/<cloud_name>/<resource_type>/upload/<transformations>/<public_id>
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload/${transPart}${publicId}`
}

/**
 * Detect MIME type from Buffer (Edge compatible)
 */
function detectMimeType(buffer: Buffer): string {
    if (buffer.slice(0, 4).toString() === '%PDF') return 'application/pdf'
    if (buffer.slice(0, 3).toString() === 'ID3') return 'audio/mpeg'
    if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) return 'audio/mpeg'
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg'
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'image/png'
    if (buffer.slice(0, 4).toString() === 'RIFF' && buffer.slice(8, 12).toString() === 'WEBP') return 'image/webp'
    return 'application/octet-stream'
}

/**
 * Audio Splitter Upload (Edge compatible)
 */
export async function splitAndUploadAudio({
    file,
    folder,
    fileName,
}: {
    file: Buffer
    folder: string
    fileName?: string
}): Promise<{
    splitUrl: string
    totalChunks: number
    totalSize: number
    originalFormat: string
    duration?: number
}> {
    const { splitAudioBuffer, generateSplitUrl, shouldSplitAudio } = await import('./audio-splitter')

    if (!shouldSplitAudio(file.length)) {
        const result = await uploadToCloudinary({
            file,
            folder,
            resourceType: 'video',
            fileName,
        })
        return {
            splitUrl: result.secureUrl,
            totalChunks: 1,
            totalSize: file.length,
            originalFormat: 'unknown',
            duration: result.duration,
        }
    }

    const splitResult = splitAudioBuffer(file)
    const CONCURRENCY = 3
    const chunkUrls: string[] = []
    const baseFileName = fileName?.replace(/\.[^/.]+$/, '') || 'audio'

    for (let i = 0; i < splitResult.chunks.length; i += CONCURRENCY) {
        const batch = splitResult.chunks.slice(i, i + CONCURRENCY)

        const batchResults = await Promise.all(
            batch.map(async (chunk) => {
                const chunkFileName = `${baseFileName}_chunk_${chunk.index.toString().padStart(3, '0')}`
                const result = await uploadToCloudinary({
                    file: chunk.data,
                    folder: `${folder}/chunks`,
                    resourceType: 'raw',
                    fileName: chunkFileName,
                })
                return { index: chunk.index, url: result.secureUrl }
            })
        )

        batchResults.sort((a, b) => a.index - b.index)
        chunkUrls.push(...batchResults.map(r => r.url))
    }

    const splitUrl = generateSplitUrl(chunkUrls)

    return {
        splitUrl,
        totalChunks: splitResult.totalChunks,
        totalSize: splitResult.totalSize,
        originalFormat: splitResult.originalFormat,
    }
}
