export interface ImageOptimizationOptions {
    maxSizeMB?: number
    maxWidthOrHeight?: number
    fileType?: 'image/webp' | 'image/jpeg' | 'image/png'
    quality?: number
}

const DEFAULT_OPTIONS: ImageOptimizationOptions = {
    maxSizeMB: 0.5,           // الحد الأقصى 500KB
    maxWidthOrHeight: 1920,   // الحد الأقصى للعرض أو الارتفاع
    fileType: 'image/webp',   // تحويل إلى WebP
    quality: 0.8,             // جودة 80%
}

/**
 * تحسين الصورة قبل الرفع
 * - تقليل الحجم
 * - تحويل إلى WebP
 * - تصغير الأبعاد إذا لزم الأمر
 * 
 * @example
 * const optimized = await optimizeImage(file)
 * // 156KB JPEG → 33KB WebP
 */
export async function optimizeImage(
    file: File,
    options: ImageOptimizationOptions = {}
): Promise<File> {
    // Check if we are in a browser environment
    if (typeof window === 'undefined') {
        return file;
    }

    const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

    console.log('🖼️ تحسين الصورة:', {
        originalName: file.name,
        originalSize: formatSize(file.size),
        originalType: file.type,
    })

    try {
        // Dynamically import browser-image-compression only on client side
            const mod = await import('browser-image-compression')
            const imageCompression = mod.default || mod

            const compressedFile = await imageCompression(file, {
            maxSizeMB: mergedOptions.maxSizeMB!,
            maxWidthOrHeight: mergedOptions.maxWidthOrHeight!,
            useWebWorker: true,
            fileType: mergedOptions.fileType,
            initialQuality: mergedOptions.quality,
        })

        // Create a new File with WebP extension
        const newFileName = file.name.replace(/\.[^/.]+$/, '.webp')
        const optimizedFile = new File([compressedFile], newFileName, {
            type: mergedOptions.fileType || 'image/webp',
        })

        const savedPercent = Math.round((1 - optimizedFile.size / file.size) * 100)

        console.log('✅ تم تحسين الصورة:', {
            newName: optimizedFile.name,
            newSize: formatSize(optimizedFile.size),
            newType: optimizedFile.type,
            savedPercent: `${savedPercent}%`,
        })

        return optimizedFile
    } catch (error) {
        console.error('❌ فشل تحسين الصورة:', error)
        // Return original file if optimization fails
        return file
    }
}

/**
 * تحسين صورة الغلاف (أبعاد أصغر)
 */
export async function optimizeCoverImage(file: File): Promise<File> {
    return optimizeImage(file, {
        maxSizeMB: 0.3,          // 300KB max for covers
        maxWidthOrHeight: 800,   // Smaller dimensions for covers
        fileType: 'image/webp',
        quality: 0.85,
    })
}

/**
 * تحسين الشعار/الأيقونة
 */
export async function optimizeLogo(file: File): Promise<File> {
    return optimizeImage(file, {
        maxSizeMB: 0.1,          // 100KB max for logos
        maxWidthOrHeight: 512,   // Logo size
        fileType: 'image/webp',
        quality: 0.9,            // Higher quality for logos
    })
}

/**
 * التحقق مما إذا كان الملف صورة
 */
export function isImageFile(file: File): boolean {
    return file.type.startsWith('image/')
}

/**
 * تنسيق حجم الملف
 */
function formatSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * الحصول على أبعاد الصورة
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
            resolve({ width: img.width, height: img.height })
            URL.revokeObjectURL(img.src)
        }
        img.onerror = reject
        img.src = URL.createObjectURL(file)
    })
}
