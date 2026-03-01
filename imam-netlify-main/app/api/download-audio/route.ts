import { NextRequest, NextResponse } from 'next/server'
import { createClient } from "@/lib/supabase/server"

// Cache chunk sizes to avoid repeated HEAD requests
// Key: full split url string, Value: array of chunk sizes
const sizeCache = new Map<string, number[]>()

async function getChunkSizes(urls: string[]): Promise<number[]> {
    const cacheKey = urls.join('|')
    if (sizeCache.has(cacheKey)) {
        return sizeCache.get(cacheKey)!
    }

    // Fetch headers in parallel
    const sizes = await Promise.all(urls.map(async (url) => {
        try {
            const res = await fetch(url, { method: 'HEAD' })
            const len = res.headers.get('content-length')
            if (len) return parseInt(len, 10)
            return 0
        } catch (e) {
            console.error('Error fetching head for chunk:', url, e)
            return 0
        }
    }))

    // Cache valid results
    if (sizes.every(s => s > 0)) {
        sizeCache.set(cacheKey, sizes)
    }

    return sizes
}

// Cache manifest data to avoid repeated JSON fetches
// Key: manifest url, Value: parsed manifest object
const manifestCache = new Map<string, any>()

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const fileUrl = searchParams.get('url')
        const filename = searchParams.get('filename') || 'audio'

        if (!fileUrl) {
            return NextResponse.json({ error: 'URL required' }, { status: 400 })
        }

        const supabase = await createClient()
        const id = searchParams.get("id")
        const table = searchParams.get("table") || "lessons"

        // Get client info for tracking
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || ''
        const userAgent = request.headers.get('user-agent') || ''

        // --- Logic: Increment Download Counts ---
        // ONLY valid if 'download=true' is present to distinguish from streaming
        const isDownloadAction = searchParams.get('download') === 'true'

        if (id && isDownloadAction) {
            try {
                const { error } = await supabase.rpc('increment_downloads', { row_id: id, table_name: table })

                if (error) {
                    console.warn(`RPC increment_downloads failed for ${table}:${id}, trying manual update.`)
                    if (['lessons', 'sermons'].includes(table)) {
                        const { data: item } = await supabase.from(table).select('download_count').eq('id', id).single()
                        if (item) {
                            await supabase.from(table).update({ download_count: (item.download_count || 0) + 1 }).eq('id', id)
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to increment download count:", err)
            }
        }


        // 1. Handle SPLIT AUDIO and MANIFEST (Virtual File System)
        if (fileUrl.startsWith('split:') || fileUrl.startsWith('manifest:')) {
            let parts: string[] = []
            let chunkSizes: number[] = []
            let totalSize = 0
            let isManifest = false
            let manifest: any = null

            if (fileUrl.startsWith('manifest:')) {
                isManifest = true
                const manifestUrl = fileUrl.replace('manifest:', '')

                // Check cache first
                if (manifestCache.has(manifestUrl)) {
                    manifest = manifestCache.get(manifestUrl)
                } else {
                    // Fetch manifest file
                    const manifestRes = await fetch(manifestUrl)
                    if (!manifestRes.ok) {
                        return NextResponse.json({ error: 'Failed to fetch audio manifest' }, { status: 502 })
                    }
                    manifest = await manifestRes.json()
                    // Cache it
                    manifestCache.set(manifestUrl, manifest)
                }

                if (!manifest.chunks || !Array.isArray(manifest.chunks)) {
                    return NextResponse.json({ error: 'Invalid manifest format' }, { status: 502 })
                }
                parts = manifest.chunks
            } else {
                // Legacy split url support
                parts = fileUrl.replace('split:', '').split('||')
            }

            if (isManifest && manifest.sizes && manifest.totalSize) {
                console.log(`✅ Using Manifest Metadata: ${manifest.sizes.length} chunks, Total: ${manifest.totalSize}`)
                chunkSizes = manifest.sizes
                totalSize = manifest.totalSize
            } else {
                console.warn(`⚠️ Manifest Metadata Missing or Invalid! Fallback to HEAD requests.`)
                // Fallback to HEAD requests (slower)
                chunkSizes = await getChunkSizes(parts)
                totalSize = chunkSizes.reduce((a, b) => a + b, 0)
            }

            if (totalSize === 0) {
                return NextResponse.json({ error: 'Failed to calculate total size' }, { status: 500 })
            }

            // Handle Range Request from Browser
            const rangeHeader = request.headers.get('range')
            let start = 0
            let end = totalSize - 1
            const isFullDownload = !rangeHeader

            if (rangeHeader) {
                const rangeParts = rangeHeader.replace(/bytes=/, '').split('-')
                let requestedStart = parseInt(rangeParts[0], 10)
                let requestedEnd = rangeParts[1] ? parseInt(rangeParts[1], 10) : totalSize - 1

                // If we have manifest with chunk sizes and duration, correct the range for proper seeking
                if (isManifest && manifest.duration && chunkSizes.length > 0) {
                    try {
                        const { timeToBytePosition } = await import('@/lib/storage/audio-splitter')

                        // Validate data before using
                        if (!Array.isArray(chunkSizes) || chunkSizes.length === 0 || !chunkSizes.every(s => s > 0)) {
                            throw new Error('Invalid chunk sizes')
                        }

                        // Convert duration to number if it's a string (for backward compatibility)
                        let numericDuration = manifest.duration;
                        if (typeof numericDuration === 'string') {
                            const parts = numericDuration.split(':').map(p => parseInt(p, 10));
                            if (parts.length === 2) {
                                numericDuration = parts[0] * 60 + parts[1]; // MM:SS
                            } else if (parts.length === 3) {
                                numericDuration = parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
                            } else {
                                numericDuration = parseFloat(numericDuration) || 0;
                            }
                        }

                        if (typeof numericDuration !== 'number' || numericDuration <= 0) {
                            throw new Error('Invalid duration')
                        }

                        // Calculate the intended time position from the browser's byte position
                        const assumedTime = (requestedStart / totalSize) * numericDuration
                        const correctedStart = timeToBytePosition(assumedTime, totalSize, chunkSizes, numericDuration)

                        let correctedEnd = requestedEnd
                        if (rangeParts[1]) {
                            const assumedEndTime = (requestedEnd / totalSize) * numericDuration
                            correctedEnd = timeToBytePosition(assumedEndTime, totalSize, chunkSizes, numericDuration)
                        }

                        start = correctedStart
                        end = correctedEnd
                    } catch (correctionError) {
                        console.error('❌ Range correction failed, using original range:', correctionError)
                        start = requestedStart
                        end = requestedEnd
                    }
                } else {
                    start = requestedStart
                    end = requestedEnd
                }
            }

            // Ensure valid range
            if (start >= totalSize || end >= totalSize) {
                return new NextResponse(null, {
                    status: 416,
                    headers: { 'Content-Range': `bytes */${totalSize}` }
                })
            }

            // Identify Which Chunks overlap with requested [start, end]
            let currentOffset = 0
            const chunksToStream: { url: string, start: number, end: number, chunkOffset: number }[] = []

            for (let i = 0; i < parts.length; i++) {
                const chunkSize = chunkSizes[i]
                const chunkStart = currentOffset
                const chunkEnd = currentOffset + chunkSize - 1

                if (chunkEnd >= start && chunkStart <= end) {
                    const relativeStart = Math.max(0, start - chunkStart)
                    const relativeEnd = Math.min(chunkSize - 1, end - chunkStart)

                    chunksToStream.push({
                        url: parts[i],
                        start: relativeStart,
                        end: relativeEnd,
                        chunkOffset: chunkSize
                    })
                }
                currentOffset += chunkSize
            }

            // Create Streaming Response
            const stream = new ReadableStream({
                async start(controller) {
                    for (const chunkInfo of chunksToStream) {
                        try {
                            if (request.signal.aborted) {
                                controller.close()
                                return
                            }

                            const res = await fetch(chunkInfo.url, {
                                headers: {
                                    'Range': `bytes=${chunkInfo.start}-${chunkInfo.end}`,
                                    'Accept-Encoding': 'identity'
                                },
                                signal: request.signal
                            })

                            if (!res.ok) throw new Error(`Upstream request failed: ${res.status}`)
                            if (!res.body) continue

                            const reader = res.body.getReader()
                            let loadedBytes = 0
                            const bytesToRead = chunkInfo.end - chunkInfo.start + 1

                            if (res.status === 200) {
                                let skipped = 0
                                while (skipped < chunkInfo.start) {
                                    const { done, value } = await reader.read()
                                    if (done) break
                                    const remainingToSkip = chunkInfo.start - skipped
                                    if (value.length <= remainingToSkip) {
                                        skipped += value.length
                                    } else {
                                        skipped += remainingToSkip
                                        const keep = value.slice(remainingToSkip)
                                        const toTake = Math.min(keep.length, bytesToRead - loadedBytes)
                                        controller.enqueue(keep.slice(0, toTake))
                                        loadedBytes += toTake
                                    }
                                }
                            }

                            while (loadedBytes < bytesToRead) {
                                if (request.signal.aborted) {
                                    reader.cancel()
                                    controller.close()
                                    return
                                }
                                const { done, value } = await reader.read()
                                if (done) break

                                const remainingNeeded = bytesToRead - loadedBytes
                                const chunkData = value

                                if (chunkData.length <= remainingNeeded) {
                                    controller.enqueue(chunkData)
                                    loadedBytes += chunkData.length
                                } else {
                                    controller.enqueue(chunkData.slice(0, remainingNeeded))
                                    loadedBytes += remainingNeeded
                                }
                            }
                        } catch (e: any) {
                            if (e.message?.includes('closed') || e.name === 'AbortError' || request.signal.aborted) {
                                return
                            }
                            console.error('Stream playback error:', e)
                            controller.error(e)
                            break
                        }
                    }
                    try { controller.close() } catch (e) { }
                }
            })

            let finalContentType = (isManifest && manifest.mimeType) ? manifest.mimeType : 'audio/mpeg'
            if (finalContentType === 'application/octet-stream' || !finalContentType) {
                finalContentType = 'audio/mpeg'
            }

            const headers: Record<string, string> = {
                'Content-Type': finalContentType,
                'Content-Length': (end - start + 1).toString(),
                'Accept-Ranges': 'bytes',
                'Cache-Control': 'public, max-age=86400, immutable',
                'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`, // Explicit inline
            }

            if (isManifest && manifest.duration) {
                headers['X-Content-Duration'] = manifest.duration.toString()
            }

            if (!isFullDownload) {
                headers['Content-Range'] = `bytes ${start}-${end}/${totalSize}`
            }

            console.log(`📤 Serving Audio range: ${start}-${end}/${totalSize}`)

            return new Response(stream, {
                status: isFullDownload ? 200 : 206,
                headers
            })
        }

        // 2. Handle Regular Files (Pass-through Proxy)
        const res = await fetch(fileUrl, {
            headers: {
                ...(request.headers.get('range') && { 'Range': request.headers.get('range')! })
            }
        })

        const responseHeaders: Record<string, string> = {
            'Content-Type': 'audio/mpeg',
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'no-store, must-revalidate',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}.mp3"`,
        }

        if (res.headers.get('Content-Length')) {
            responseHeaders['Content-Length'] = res.headers.get('Content-Length')!
        }
        if (res.headers.get('Content-Range')) {
            responseHeaders['Content-Range'] = res.headers.get('Content-Range')!
        }

        return new NextResponse(res.body, {
            status: res.status,
            headers: responseHeaders
        })

    } catch (error) {
        console.error('Audio Proxy Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function HEAD(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const fileUrl = searchParams.get('url')
        const filename = searchParams.get('filename') || 'audio'

        if (!fileUrl) return new NextResponse(null, { status: 400 })

        let totalSize = 0
        let contentType = 'audio/mpeg'

        const headers: Record<string, string> = {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
            'Cache-Control': 'public, max-age=86400',
        }

        if (fileUrl.startsWith('split:') || fileUrl.startsWith('manifest:')) {
            if (fileUrl.startsWith('manifest:')) {
                const manifestUrl = fileUrl.replace('manifest:', '')
                let manifest = null

                if (manifestCache.has(manifestUrl)) {
                    manifest = manifestCache.get(manifestUrl)
                } else {
                    const manifestRes = await fetch(manifestUrl)
                    if (manifestRes.ok) {
                        manifest = await manifestRes.json()
                        manifestCache.set(manifestUrl, manifest)
                    }
                }

                if (manifest) {
                    if (manifest.totalSize) headers['Content-Length'] = manifest.totalSize.toString()
                    if (manifest.mimeType) headers['Content-Type'] = manifest.mimeType
                    if (manifest.duration) headers['X-Content-Duration'] = manifest.duration.toString()
                }
            } else {
                const parts = fileUrl.replace('split:', '').split('||')
                const chunkSizes = await getChunkSizes(parts)
                const total = chunkSizes.reduce((a, b) => a + b, 0)
                headers['Content-Length'] = total.toString()
            }
        } else {
            const res = await fetch(fileUrl, { method: 'HEAD' })
            if (res.headers.get('content-length')) headers['Content-Length'] = res.headers.get('content-length')!
            if (res.headers.get('content-type')) headers['Content-Type'] = res.headers.get('content-type')!
        }

        return new NextResponse(null, { status: 200, headers })

    } catch (e) {
        console.error('HEAD Error:', e)
        return new NextResponse(null, { status: 500 })
    }
}
