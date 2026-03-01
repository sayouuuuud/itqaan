/**
 * Audio Splitter Utility
 * Splits audio files into smaller chunks for progressive streaming
 * Similar to Spotify/YouTube streaming approach
 */

// Adaptive chunk sizes for optimal streaming experience
// First chunk is small for instant playback, rest are larger for efficient loading
export const FIRST_CHUNK_SIZE = 200 * 1024  // 200KB (~3-5 seconds audio) - instant start
export const REGULAR_CHUNK_SIZE = 750 * 1024 // 750KB (~20 seconds audio) - efficient loading

export interface AudioChunk {
    index: number
    data: Buffer
    size: number
}

export interface SplitResult {
    chunks: AudioChunk[]
    totalSize: number
    totalChunks: number
    originalFormat: string
}

/**
 * Detects the audio format from buffer magic bytes
 */
export function detectAudioFormat(buffer: Buffer): 'mp3' | 'm4a' | 'unknown' {
    // MP3 with ID3 tag
    if (buffer.slice(0, 3).toString() === 'ID3') {
        return 'mp3'
    }

    // MP3 without ID3 (sync word)
    if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) {
        return 'mp3'
    }

    // M4A/AAC (ftyp atom)
    if (buffer.slice(4, 8).toString() === 'ftyp') {
        return 'm4a'
    }

    return 'unknown'
}

/**
 * Splits an audio buffer into chunks with adaptive sizing
 * First chunk is 200KB for instant playback
 * Remaining chunks are 750KB for efficient streaming
 */
export function splitAudioBuffer(buffer: Buffer): SplitResult {
    const format = detectAudioFormat(buffer)
    const chunks: AudioChunk[] = []
    const totalSize = buffer.length

    let offset = 0
    let index = 0

    while (offset < totalSize) {
        // First chunk is smaller for instant playback
        const chunkSize = index === 0 ? FIRST_CHUNK_SIZE : REGULAR_CHUNK_SIZE
        const end = Math.min(offset + chunkSize, totalSize)
        const chunkData = buffer.slice(offset, end)

        chunks.push({
            index,
            data: chunkData,
            size: chunkData.length
        })

        offset = end
        index++
    }

    console.log(`🔪 Split audio into ${chunks.length} chunks (first: 200KB, rest: 750KB, format: ${format}, total: ${(totalSize / (1024 * 1024)).toFixed(2)}MB)`)

    return {
        chunks,
        totalSize,
        totalChunks: chunks.length,
        originalFormat: format
    }
}

/**
 * Calculates estimated duration per chunk based on chunk sizes and total duration
 */
export function calculateChunkDurations(totalDuration: number, chunkSizes: number[]): number[] {
    if (!chunkSizes || chunkSizes.length === 0 || totalDuration <= 0) {
        console.warn('Invalid parameters for calculateChunkDurations:', { totalDuration, chunkSizes })
        return []
    }

    const totalSize = chunkSizes.reduce((a, b) => a + b, 0)

    if (totalSize <= 0) {
        console.warn('Invalid total size:', totalSize)
        return []
    }

    // Calculate duration for each chunk based on its size proportion
    return chunkSizes.map(chunkSize => {
        const proportion = chunkSize / totalSize
        return totalDuration * proportion
    })
}

/**
 * Calculates cumulative time offsets for chunks (when each chunk starts)
 */
export function calculateChunkTimeOffsets(chunkDurations: number[]): number[] {
    const offsets: number[] = [0]
    for (let i = 1; i < chunkDurations.length; i++) {
        offsets.push(offsets[i - 1] + chunkDurations[i - 1])
    }
    return offsets
}

/**
 * Generates a split URL from an array of chunk URLs
 * Format: split:url1||url2||url3...
 */
export function generateSplitUrl(chunkUrls: string[]): string {
    return `split:${chunkUrls.join('||')}`
}

/**
 * Parses a split URL into individual chunk URLs
 */
export function parseSplitUrl(splitUrl: string): string[] {
    if (!splitUrl.startsWith('split:')) {
        return [splitUrl]
    }
    return splitUrl.replace('split:', '').split('||')
}

/**
 * Determines if a file should be split based on size
 * Only split files larger than 2MB to avoid overhead for small files
 */
export function shouldSplitAudio(fileSize: number): boolean {
    const MIN_SIZE_FOR_SPLIT = 2 * 1024 * 1024 // 2MB
    return fileSize >= MIN_SIZE_FOR_SPLIT
}

/**
 * Gets chunk index for a given time position using actual chunk durations
 */
export function getChunkIndexForTime(
    targetTime: number,
    chunkDurations: number[]
): number {
    if (!chunkDurations || chunkDurations.length === 0) return 0
    if (targetTime <= 0) return 0

    const timeOffsets = calculateChunkTimeOffsets(chunkDurations)

    // Find the chunk where targetTime falls within its time range
    for (let i = 0; i < chunkDurations.length; i++) {
        const chunkStart = timeOffsets[i]
        const chunkEnd = chunkStart + chunkDurations[i]

        if (targetTime >= chunkStart && targetTime < chunkEnd) {
            return i
        }
    }

    // If targetTime is beyond the last chunk, return the last chunk
    return chunkDurations.length - 1
}

/**
 * Calculates the time offset within a specific chunk using actual chunk durations
 */
export function getTimeOffsetInChunk(
    targetTime: number,
    chunkIndex: number,
    chunkDurations: number[]
): number {
    if (!chunkDurations || chunkDurations.length === 0) return 0
    if (chunkIndex >= chunkDurations.length) return 0

    const timeOffsets = calculateChunkTimeOffsets(chunkDurations)
    const chunkStartTime = timeOffsets[chunkIndex]

    return Math.max(0, targetTime - chunkStartTime)
}

/**
 * Converts byte position to time position using actual chunk sizes
 * This is used to correct seeking when chunks have different sizes
 */
export function bytePositionToTime(bytePosition: number, totalSize: number, chunkSizes: number[], totalDuration: number): number {
    if (totalSize <= 0 || !chunkSizes || chunkSizes.length === 0 || totalDuration <= 0) {
        return 0
    }

    // Find which chunk contains this byte position
    let currentOffset = 0
    for (let i = 0; i < chunkSizes.length; i++) {
        const chunkStart = currentOffset
        const chunkEnd = currentOffset + chunkSizes[i]

        if (bytePosition >= chunkStart && bytePosition < chunkEnd) {
            // Calculate position within this chunk (0-1)
            const chunkPosition = (bytePosition - chunkStart) / chunkSizes[i]

            // Calculate time within this chunk
            const chunkDurations = calculateChunkDurations(totalDuration, chunkSizes)
            const timeOffsets = calculateChunkTimeOffsets(chunkDurations)

            return timeOffsets[i] + (chunkPosition * chunkDurations[i])
        }

        currentOffset += chunkSizes[i]
    }

    return totalDuration // Beyond last chunk
}

/**
 * Converts time position to byte position using actual chunk sizes
 * This is used for correcting range requests when seeking
 */
export function timeToBytePosition(targetTime: number, totalSize: number, chunkSizes: number[], totalDuration: number): number {
    if (totalSize <= 0 || !chunkSizes || chunkSizes.length === 0 || totalDuration <= 0) {
        console.warn('Invalid parameters for timeToBytePosition:', { totalSize, chunkSizes, totalDuration })
        return 0
    }

    try {
        const chunkDurations = calculateChunkDurations(totalDuration, chunkSizes)
        const chunkIndex = getChunkIndexForTime(targetTime, chunkDurations)
        const timeOffsetInChunk = getTimeOffsetInChunk(targetTime, chunkIndex, chunkDurations)

        // Calculate byte position within the chunk
        const chunkSize = chunkSizes[chunkIndex]
        const chunkDuration = chunkDurations[chunkIndex]

        if (chunkDuration <= 0) {
            console.warn('Invalid chunk duration:', { chunkIndex, chunkDuration })
            return 0
        }

        const byteOffsetInChunk = chunkSize * (timeOffsetInChunk / chunkDuration)

        // Calculate total byte position
        let totalByteOffset = 0
        for (let i = 0; i < chunkIndex; i++) {
            totalByteOffset += chunkSizes[i]
        }

        const result = Math.floor(totalByteOffset + byteOffsetInChunk)

        // Ensure result is within bounds
        const finalResult = Math.max(0, Math.min(result, totalSize - 1))

        console.log(`🔄 timeToBytePosition: time=${targetTime.toFixed(2)}s → byte=${finalResult} (${totalByteOffset}+${byteOffsetInChunk.toFixed(0)})`)

        return finalResult
    } catch (error) {
        console.error('Error in timeToBytePosition:', error, { targetTime, totalSize, chunkSizes, totalDuration })
        return 0
    }
}
