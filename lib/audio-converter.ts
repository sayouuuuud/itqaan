import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { Readable, Writable } from 'stream';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Set ffmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

/**
 * Converts a WebM audio buffer to an MP4 (AAC) audio buffer.
 */
export async function convertWebMToMP4(inputBuffer: Buffer): Promise<Buffer> {
  const tempInputPath = path.join(os.tmpdir(), `input-${Date.now()}.webm`);
  const tempOutputPath = path.join(os.tmpdir(), `output-${Date.now()}.mp4`);

  try {
    // Write buffer to temp file
    fs.writeFileSync(tempInputPath, inputBuffer);

    return new Promise((resolve, reject) => {
      ffmpeg(tempInputPath)
        .outputOptions([
          '-c:a aac',       // Use AAC codec
          '-b:a 128k',      // 128kbps bitrate
          '-movflags +faststart' // Help with streaming
        ])
        .toFormat('mp4')
        .on('error', (err) => {
          console.error('[AudioConverter] ffmpeg error:', err);
          reject(err);
        })
        .on('end', () => {
          try {
            const outputBuffer = fs.readFileSync(tempOutputPath);
            resolve(outputBuffer);
          } catch (readErr) {
            reject(readErr);
          }
        })
        .save(tempOutputPath);
    });
  } finally {
    // Cleanup temp files
    try {
      if (fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath);
      if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
    } catch (cleanupErr) {
      console.warn('[AudioConverter] Cleanup error:', cleanupErr);
    }
  }
}
