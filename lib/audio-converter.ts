import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
import { writeFile, readFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

// Set the path to the ffmpeg binary
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic)
}

/**
 * Transcodes a WebM audio buffer to MP4/AAC
 * @param inputBuffer The input WebM audio as a Buffer
 * @returns A promise that resolves to the transcoded MP4 audio as a Buffer
 */
export async function convertWebMToMP4(inputBuffer: Buffer): Promise<Buffer> {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  const tmpIn  = join(tmpdir(), `audio-in-${timestamp}-${random}.webm`)
  const tmpOut = join(tmpdir(), `audio-out-${timestamp}-${random}.mp4`)
  
  try {
    console.log(`[FFmpeg] Starting conversion: ${tmpIn} -> ${tmpOut}`)
    
    // Write input buffer to temporary file
    await writeFile(tmpIn, inputBuffer)
    
    // Perform conversion using fluent-ffmpeg
    await new Promise((resolve, reject) => {
      ffmpeg(tmpIn)
        .audioCodec('aac')
        .audioBitrate('128k')
        .toFormat('mp4')
        .on('start', (commandLine) => {
          console.log('[FFmpeg] Spawned FFmpeg with command: ' + commandLine)
        })
        .on('error', (err) => {
          console.error('[FFmpeg] Error during conversion:', err.message)
          reject(err)
        })
        .on('end', () => {
          console.log('[FFmpeg] Conversion finished successfully')
          resolve(true)
        })
        .save(tmpOut)
    })
    
    // Read the converted file back into a buffer
    const outputBuffer = await readFile(tmpOut)
    
    console.log(`[FFmpeg] Conversion successful, output size: ${outputBuffer.length} bytes`)
    
    return outputBuffer
  } catch (error) {
    console.error('[FFmpeg] Fatal conversion error:', error)
    throw error
  } finally {
    // Cleanup temporary files
    try {
      await unlink(tmpIn).catch(() => {})
      await unlink(tmpOut).catch(() => {})
    } catch (cleanupError) {
      console.warn('[FFmpeg] Cleanup failed:', cleanupError)
    }
  }
}
