"use client"

import React, { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X, Loader2, Link2, ImageIcon, FileText, Music } from 'lucide-react'
import { useUploadThing } from '@/lib/storage/uploadthing'
import { optimizeImage, optimizeCoverImage, optimizeLogo, isImageFile } from '@/lib/utils/image-optimizer'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

interface FileUploadProps {
    accept?: string
    folder: string
    label: string
    onUploadComplete: (url: string, fileSize?: string) => void
    currentFile?: string
    allowExternalUrl?: boolean
    onExternalUrlSubmit?: (url: string) => Promise<{ success: boolean; error?: string }>
    variant?: 'default' | 'cover' | 'logo'
    onDurationChange?: (duration: string) => void
    disabled?: boolean
}

export function FileUpload({
    accept = '*',
    folder,
    label,
    onUploadComplete,
    currentFile,
    allowExternalUrl = false,
    onExternalUrlSubmit,
    variant = 'default',
    onDurationChange,
    disabled = false,
}: FileUploadProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [isOptimizing, setIsOptimizing] = useState(false)
    const [showUrlInput, setShowUrlInput] = useState(false)
    const [externalUrl, setExternalUrl] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [preview, setPreview] = useState<string | null>(currentFile || null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // UploadThing hook for images
    const { startUpload, isUploading: isUploadThingUploading } = useUploadThing(
        variant === 'cover' ? 'coverImageUploader' :
            variant === 'logo' ? 'logoUploader' : 'imageUploader'
    )

    // UploadThing hook for PDFs
    const { startUpload: startPdfUpload, isUploading: isPdfUploading } = useUploadThing('pdfUploader')

    // Determine if the accept type is for images
    const isImageAccept = accept.includes('image')

    /**
     * رفع صورة إلى UploadThing
     */
    const uploadImageToUploadThing = async (file: File): Promise<string> => {
        // تحسين الصورة أولاً
        setIsOptimizing(true)
        let optimizedFile: File

        try {
            if (variant === 'cover') {
                optimizedFile = await optimizeCoverImage(file)
            } else if (variant === 'logo') {
                optimizedFile = await optimizeLogo(file)
            } else {
                optimizedFile = await optimizeImage(file)
            }
        } catch (e) {
            console.error('Image optimization failed, using original:', e)
            optimizedFile = file
        }
        setIsOptimizing(false)

        // رفع إلى UploadThing
        const result = await startUpload([optimizedFile])
        if (!result || result.length === 0) {
            throw new Error('فشل رفع الصورة')
        }
        return result[0].ufsUrl
    }

    /**
     * رفع PDF إلى UploadThing
     */
    const uploadPdfToUploadThing = async (file: File): Promise<string> => {
        const result = await startPdfUpload([file])
        if (!result || result.length === 0) {
            throw new Error('فشل رفع ملف PDF')
        }
        return result[0].ufsUrl
    }

    // Upload Progress State
    const [uploadProgress, setUploadProgress] = useState(0)

    /**
     * رفع ملف كبير مقسم (Client-side Chunking)
     */
    /**
     * رفع ملف كبير مقسم (Client-side Chunking)
     * تم التحديث لاستخدام XHR لدعم شريط التقدم الحقيقي وتقليل حجم القطع لتجنب Timeout
     */
    const uploadLargeFileInChunks = async (file: File): Promise<string> => {
        // Updated constants to match server-side streaming logic
        const FIRST_CHUNK_SIZE = 200 * 1024 // 200KB for first chunk
        const REGULAR_CHUNK_SIZE = 750 * 1024 // 750KB for remaining chunks

        // Calculate total chunks
        const remainingSize = Math.max(0, file.size - FIRST_CHUNK_SIZE)
        const totalChunks = 1 + Math.ceil(remainingSize / REGULAR_CHUNK_SIZE)
        const chunkUrls: string[] = []
        const chunkSizes: number[] = [] // Store chunk sizes

        // Use base filename without extension for chunks
        const baseFilename = file.name.replace(/\.[^/.]+$/, '')

        // Detect format for logging
        const isAudio = file.type.startsWith('audio/') ||
            file.name.toLowerCase().endsWith('.mp3') ||
            file.name.toLowerCase().endsWith('.m4a') ||
            file.name.toLowerCase().endsWith('.wav')

        // Determine correct folder (append /chunks for audio splitting to match server behavior)
        const uploadFolder = isAudio && file.size > 2 * 1024 * 1024
            ? `${folder}/chunks`
            : folder

        console.log(`📦 Starting chunked upload for ${file.name} (${formatFileSize(file.size)}) in ${totalChunks} chunks (first: 200KB)`)

        let totalUploadedBytes = 0

        for (let i = 0; i < totalChunks; i++) {
            const isFirstChunk = i === 0
            const chunkSize = isFirstChunk ? FIRST_CHUNK_SIZE : REGULAR_CHUNK_SIZE
            // Calculate start and end bytes
            const start = isFirstChunk ? 0 : FIRST_CHUNK_SIZE + (i - 1) * REGULAR_CHUNK_SIZE
            const end = Math.min(start + chunkSize, file.size)

            const chunkBlob = file.slice(start, end)
            const currentChunkSize = chunkBlob.size

            // Store size
            chunkSizes.push(currentChunkSize)

            // Create chunk filename: filename_chunk_000.bin
            const chunkName = `${baseFilename}_chunk_${i.toString().padStart(3, '0')}.bin`
            const chunkFile = new File([chunkBlob], chunkName, { type: 'application/octet-stream' })

            const formData = new FormData()
            formData.append('file', chunkFile)
            formData.append('folder', uploadFolder) // Use correct folder
            formData.append('resourceType', 'raw')

            console.log(`📤 Uploading chunk ${i + 1}/${totalChunks}...`)

            // Use XHR for progress tracking (same as before)
            const uploadPromise = new Promise<any>((resolve, reject) => {
                const xhr = new XMLHttpRequest()
                xhr.open('POST', '/api/cloudinary/upload')

                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const chunkProgress = e.loaded
                        const totalLoaded = totalUploadedBytes + chunkProgress
                        const percent = Math.round((totalLoaded / file.size) * 100)
                        setUploadProgress(Math.min(percent, 99))
                    }
                }

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const response = JSON.parse(xhr.responseText)
                            resolve(response)
                        } catch (e) {
                            reject(new Error('Invalid JSON response'))
                        }
                    } else {
                        reject(new Error(`Upload failed with status ${xhr.status}`))
                    }
                }

                xhr.onerror = () => reject(new Error('Network error during upload'))

                xhr.send(formData)
            })

            try {
                const data = await uploadPromise
                if (!data.success) {
                    throw new Error(data.error || `فشل رفع الجزء ${i + 1}`)
                }

                // Store the secure URL
                // Only push if it's a valid URL string
                if (data.url && typeof data.url === 'string') {
                    chunkUrls.push(data.url)
                } else if (data.secure_url) {
                    chunkUrls.push(data.secure_url)
                }

                // Update total uploaded bytes only after success
                totalUploadedBytes += currentChunkSize

            } catch (error) {
                console.error(`❌ Chunk ${i + 1} failed:`, error)
                throw error
            }
        }

        setUploadProgress(99)

        // Upload Manifest File
        console.log('📝 Uploading manifest file with metadata...')
        const manifestContent = JSON.stringify({
            chunks: chunkUrls,
            sizes: chunkSizes,       // Metadata: Exact size of each chunk
            totalSize: file.size,    // Metadata: Exact total size
            duration: await getAudioDurationNumeric(file), // Numeric duration for seeking
            mimeType: file.type || 'audio/mpeg'      // Added: mimeType
        })
        const manifestFile = new File([manifestContent], `${baseFilename}_manifest.json`, { type: 'application/json' })

        const manifestFormData = new FormData()
        manifestFormData.append('file', manifestFile)
        manifestFormData.append('folder', uploadFolder)
        manifestFormData.append('resourceType', 'raw')

        const manifestResponse = await fetch('/api/cloudinary/upload', {
            method: 'POST',
            body: manifestFormData
        })

        const manifestData = await manifestResponse.json()
        if (!manifestData.success) {
            throw new Error('فشل رفع ملف المانيفست')
        }

        const finalUrl = `manifest:${manifestData.url || manifestData.secure_url}`
        console.log('✅ Final Audio URL (Manifest):', finalUrl)
        setUploadProgress(100)
        return finalUrl
    }

    /**
     * رفع ملف إلى Cloudinary
     */
    const uploadFileToCloudinary = async (file: File): Promise<string> => {
        // Check if this is an audio file
        const isAudioFile = file.type.startsWith('audio/') ||
            file.name.toLowerCase().endsWith('.mp3') ||
            file.name.toLowerCase().endsWith('.m4a') ||
            file.name.toLowerCase().endsWith('.wav')

        // Force chunking for large audio OR any file > 9MB (safely below 10MB limit)
        const CHUNK_THRESHOLD = 9 * 1024 * 1024 // 9MB
        const isLargeAudio = isAudioFile && file.size > 2 * 1024 * 1024 // > 2MB

        if (file.size > CHUNK_THRESHOLD || isLargeAudio) {
            console.log('⚡ Using client-side chunking strategy')
            return await uploadLargeFileInChunks(file)
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', folder)
        // No need for 'splitAudio' flag anymore since we handle it client-side

        const response = await fetch('/api/cloudinary/upload', {
            method: 'POST',
            body: formData,
        })

        const data = await response.json()
        if (!response.ok || !data.success) {
            throw new Error(data.error || 'فشل رفع الملف')
        }

        return data.url
    }

    /**
     * تنسيق حجم الملف
     */
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    /**
     * حساب مدة الصوت (للعرض في UI)
     */
    const getAudioDuration = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const audio = document.createElement('audio');
            const url = URL.createObjectURL(file);
            audio.src = url;

            audio.onloadedmetadata = () => {
                const duration = audio.duration; // seconds
                // Format to HH:MM:SS or MM:SS
                const hours = Math.floor(duration / 3600);
                const minutes = Math.floor((duration % 3600) / 60);
                const seconds = Math.floor(duration % 60);

                let formatted = '';
                if (hours > 0) {
                    formatted = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                } else {
                    formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                }

                URL.revokeObjectURL(url);
                resolve(formatted);
            };

            audio.onerror = () => {
                URL.revokeObjectURL(url);
                resolve('');
            };
        });
    }

    /**
     * حساب مدة الصوت (للـ manifest - كرقم)
     */
    const getAudioDurationNumeric = (file: File): Promise<number> => {
        return new Promise((resolve) => {
            const audio = document.createElement('audio');
            const url = URL.createObjectURL(file);
            audio.src = url;

            audio.onloadedmetadata = () => {
                const duration = audio.duration; // seconds
                URL.revokeObjectURL(url);
                resolve(duration);
            };

            audio.onerror = () => {
                URL.revokeObjectURL(url);
                resolve(0); // Return 0 on error
            };
        });
    }

    /**
     * معالجة الملف (سواء من Input أو Drop)
     */
    const processFile = useCallback(async (file: File) => {
        if (!file) return

        setError(null)
        setIsUploading(true)
        setUploadProgress(0)

        // حساب حجم الملف
        const fileSize = formatFileSize(file.size)

        // حساب مدة الصوت إذا كان الملف صوتياً
        if (file.type.startsWith('audio/') && onDurationChange) {
            getAudioDuration(file).then(duration => {
                if (duration) onDurationChange(duration)
            })
        }

        try {
            let url: string

            if (isImageFile(file)) {
                // رفع الصور إلى UploadThing مع تحسين
                setUploadProgress(30)
                url = await uploadImageToUploadThing(file)
                setUploadProgress(100)
            } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                // رفع PDF إلى UploadThing
                setUploadProgress(50)
                url = await uploadPdfToUploadThing(file)
                setUploadProgress(100)
            } else {
                // رفع الملفات الأخرى (صوت/فيديو) إلى Cloudinary
                url = await uploadFileToCloudinary(file)
                setUploadProgress(100)
            }

            setPreview(url)
            onUploadComplete(url, fileSize)
        } catch (err: any) {
            console.error('Upload error:', err)
            setError(err.message || 'فشل رفع الملف')
        } finally {
            setIsUploading(false)
            setUploadProgress(0)
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }, [folder, isImageAccept, onUploadComplete, startUpload, isImageFile, optimizeImage, optimizeLogo, variant, onDurationChange])

    /**
     * معالجة اختيار الملف من Input
     */
    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) processFile(file)
    }, [processFile])

    /**
     * معالجة رابط خارجي
     */
    const handleExternalUrl = async () => {
        if (!externalUrl.trim()) return

        setError(null)
        setIsUploading(true)

        try {
            // إذا كان الملف صورة، نستورده ونحسنه
            if (isImageAccept) {
                setIsOptimizing(true)
                const response = await fetch('/api/import-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: externalUrl, folder }),
                })
                const data = await response.json()
                setIsOptimizing(false)

                if (!data.success) {
                    throw new Error(data.error || 'فشل استيراد الصورة')
                }

                setPreview(data.url)
                onUploadComplete(data.url)
            } else if (onExternalUrlSubmit) {
                // للملفات الأخرى (PDF مثلاً)
                const result = await onExternalUrlSubmit(externalUrl)
                if (!result.success) {
                    throw new Error(result.error || 'فشل استيراد الملف')
                }
            } else {
                onUploadComplete(externalUrl)
            }
            setShowUrlInput(false)
            setExternalUrl('')
        } catch (err: any) {
            setError(err.message || 'فشل استيراد الملف')
        } finally {
            setIsUploading(false)
            setIsOptimizing(false)
        }
    }

    /**
     * إزالة الملف
     */
    const handleRemove = () => {
        setPreview(null)
        onUploadComplete('')
    }

    /**
     * أيقونة نوع الملف
     */
    const getFileIcon = () => {
        if (isImageAccept) return <ImageIcon className="h-8 w-8 text-muted-foreground" />
        if (accept.includes('pdf')) return <FileText className="h-8 w-8 text-muted-foreground" />
        if (accept.includes('audio')) return <Music className="h-8 w-8 text-muted-foreground" />
        return <Upload className="h-8 w-8 text-muted-foreground" />
    }

    const isLoading = isUploading || isOptimizing || isUploadThingUploading || isPdfUploading

    return (
        <div className="space-y-2">

            {/* Upload Progress Dialog */}
            <Dialog open={isLoading} onOpenChange={(open) => !open && isLoading ? null : setIsUploading(open)}>
                <DialogContent className="sm:max-w-md [&>button]:hidden">
                    <div className="flex flex-col items-center justify-center p-6 space-y-6">
                        {/* Animated Icon */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                            <div className="relative bg-primary/10 p-4 rounded-full">
                                <Upload className="w-8 h-8 text-primary animate-bounce" />
                            </div>
                        </div>

                        <div className="text-center space-y-2">
                            <DialogTitle className="text-lg font-bold text-foreground">
                                {isOptimizing ? 'جاري تحسين الصورة...' : 'جاري رفع الملف...'}
                            </DialogTitle>
                            <p className="text-sm text-muted-foreground">
                                يرجى الانتظار، جاري معالجة ورفع الملف للسيرفر
                            </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>التقدم</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <div className="h-2 w-full bg-secondary/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-300 ease-out"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Label>{label}</Label>

            {/* Preview */}
            {preview && (
                <div className="relative inline-block">
                    {isImageAccept || preview.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i) ? (
                        <img
                            src={preview}
                            alt="معاينة"
                            className="w-32 h-32 object-cover rounded-lg border border-border"
                        />
                    ) : (
                        <div className="w-32 h-32 rounded-lg border border-border bg-muted flex items-center justify-center">
                            {getFileIcon()}
                        </div>
                    )}
                    {!disabled && (
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            )}

            {/* Upload Area */}
            {!preview && (
                <div
                    onClick={() => !isLoading && !disabled && fileInputRef.current?.click()}
                    onDragOver={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                    }}
                    onDragLeave={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                    }}
                    onDrop={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (isLoading || disabled) return

                        const file = e.dataTransfer.files?.[0]
                        if (file) {
                            processFile(file)
                        }
                    }}
                    className={`
            border-2 border-dashed border-border rounded-lg p-6
            flex flex-col items-center justify-center gap-2
            cursor-pointer hover:border-primary/50 hover:bg-muted/50
            transition-colors
            transition-colors
            ${(isLoading || disabled) ? 'opacity-50 cursor-not-allowed' : ''}
          `}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="text-sm text-muted-foreground">
                                {isOptimizing ? 'جاري تحسين الصورة...' : 'جاري الرفع...'}
                            </span>
                        </>
                    ) : (
                        <>
                            {getFileIcon()}
                            <span className="text-sm text-muted-foreground">
                                {disabled ? "الرفع غير مفعل" : "اضغط لاختيار ملف أو اسحب وأفلت"}
                            </span>
                            {isImageAccept && (
                                <span className="text-xs text-muted-foreground">
                                    سيتم تحسين الصورة تلقائياً
                                </span>
                            )}
                        </>
                    )}
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileSelect}
                className="hidden"
                disabled={isLoading}
            />

            {/* External URL Option */}
            {allowExternalUrl && !preview && !disabled && (
                <div className="space-y-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowUrlInput(!showUrlInput)}
                        disabled={isLoading}
                    >
                        <Link2 className="h-4 w-4 ml-2" />
                        استيراد من رابط
                    </Button>

                    {showUrlInput && (
                        <div className="flex gap-2">
                            <Input
                                value={externalUrl}
                                onChange={(e) => setExternalUrl(e.target.value)}
                                placeholder="https://..."
                                className="flex-1"
                                disabled={isLoading}
                            />
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleExternalUrl}
                                disabled={isLoading || !externalUrl.trim()}
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'استيراد'}
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Error */}
            {error && (
                <p className="text-sm text-destructive">{error}</p>
            )}
        </div>
    )
}
