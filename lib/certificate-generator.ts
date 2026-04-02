import sharp from 'sharp'
import path from 'path'
import fs from 'fs'
import { uploadToStorage } from './storage'
import { transliterate, containsArabic } from './transliterate'

import TextToSVG from 'text-to-svg'

const CERT_TEMPLATE = path.join(process.cwd(), 'public', 'Certificate.png')
const FONT_GEORGIA = path.join(process.cwd(), 'lib/fonts/georgiab.ttf')
const FONT_COURIER = path.join(process.cwd(), 'lib/fonts/courbd.ttf')

// Load font engines
let georgiaEngine: any = null
let courierEngine: any = null

try {
  georgiaEngine = TextToSVG.loadSync(FONT_GEORGIA)
  courierEngine = TextToSVG.loadSync(FONT_COURIER)
} catch (e) {
  console.error('Failed to load local fonts for certificate:', e)
}

// ─── Constants ───────────────────────────────────

// Text Colors
const MAIN_COLOR = '#3D2B1F'

// Student Name
const NAME_X = 1264       // Horizontal center of 2528
const NAME_Y = 605        // Vertically below "proudly presents..."

// Top Right Serial Box (estimated from pill outline)
const SERIAL_TOP_X = 1840 // Box left edge (moved further left)
const SERIAL_TOP_Y = 120  // Box top edge
const SERIAL_TOP_W = 350  // Width to center in
const SERIAL_TOP_H = 80   // Height to center in

// Bottom Center Serial
const SERIAL_BOT_X = 1264 // Horizontal center
const SERIAL_BOT_Y = 1560 // Centered in the lower rectangle

export function generateSerialCode(seq: number): string {
  const padded = String(seq).padStart(8, '0')
  return `ITQ-MAK-${padded}`
}

// ─── SVG Layers using Text-to-SVG (Paths) ──────────

function topSerialSvg(text: string): Buffer {
  if (!courierEngine) return Buffer.from('<svg></svg>')

  const svgOptions = {
    x: 0,
    y: 0,
    fontSize: 28,
    anchor: 'top',
    attributes: {
      fill: MAIN_COLOR,
    }
  }

  const metrics = courierEngine.getMetrics(text, svgOptions)
  const x = (SERIAL_TOP_W - metrics.width) / 2
  const y = (SERIAL_TOP_H - metrics.height) / 2 + 5 // Slight manual adjustment

  const path = courierEngine.getSVG(text, {
    ...svgOptions,
    x,
    y: y + metrics.ascender
  })

  return Buffer.from(
    `<svg width="${SERIAL_TOP_W}" height="${SERIAL_TOP_H}" xmlns="http://www.w3.org/2000/svg">
       ${path.replace(/<\/?svg[^>]*>/g, '')}
     </svg>`
  )
}

function bottomSerialSvg(text: string): Buffer {
  if (!courierEngine) return Buffer.from('<svg></svg>')

  const svgOptions = {
    x: 400, // Center of 800
    y: 40,  // Center of 80
    fontSize: 38,
    anchor: 'center middle',
    attributes: {
      fill: MAIN_COLOR,
      'letter-spacing': '2'
    }
  }

  const path = courierEngine.getSVG(text, svgOptions)

  return Buffer.from(
    `<svg width="800" height="80" xmlns="http://www.w3.org/2000/svg">
       ${path.replace(/<\/?svg[^>]*>/g, '')}
     </svg>`
  )
}

function nameSvg(text: string): Buffer {
  if (!georgiaEngine) return Buffer.from('<svg></svg>')

  const len = text.length
  let fontSize = 96
  if (len > 35) fontSize = 64
  else if (len > 25) fontSize = 80

  const svgOptions = {
    x: 900, // Center of 1800
    y: 75,  // Center of 150
    fontSize: fontSize,
    anchor: 'center middle',
    attributes: {
      fill: MAIN_COLOR,
    }
  }

  const path = georgiaEngine.getSVG(text, svgOptions)

  return Buffer.from(
    `<svg width="1800" height="150" xmlns="http://www.w3.org/2000/svg">
       ${path.replace(/<\/?svg[^>]*>/g, '')}
     </svg>`
  )
}

// ─── Main Generator ───────────────────────────────

export interface GenerateCertificateOptions {
  studentId: string
  studentName: string       // Raw name (may be Arabic)
  photoUrl?: string | null  // Ignored in this template
  serialCode: string
}

export async function generateCertificateImage(
  opts: GenerateCertificateOptions
): Promise<{ url: string | null; buffer: Buffer | null; nameEn: string }> {
  try {
    const { studentId, studentName, serialCode } = opts

    // Resolve the English name and force it to be uppercase
    const nameEn = containsArabic(studentName)
      ? transliterate(studentName).toUpperCase()
      : studentName.toUpperCase()

    if (!fs.existsSync(CERT_TEMPLATE)) {
      throw new Error('Certificate.png template not found in public folder')
    }

    const composites: sharp.OverlayOptions[] = []

    // 1. Name
    composites.push({
      input: nameSvg(nameEn),
      top: NAME_Y - 75,
      left: NAME_X - 900
    })

    // 2. Top-Right Serial
    composites.push({
      input: topSerialSvg(serialCode),
      top: SERIAL_TOP_Y,
      left: SERIAL_TOP_X
    })

    // 3. Bottom Center Serial
    composites.push({
      input: bottomSerialSvg(serialCode),
      top: SERIAL_BOT_Y - 40,
      left: SERIAL_BOT_X - 400
    })

    // Combine
    const outputBuffer = await sharp(CERT_TEMPLATE)
      .composite(composites)
      .png({ compressionLevel: 8 })
      .toBuffer()

    // Upload
    const fileName = `certificate-${studentId}-${Date.now()}.png`
    const uploadResult = await uploadToStorage(outputBuffer, fileName, 'image/png')

    return {
      url: uploadResult?.url || null,
      buffer: outputBuffer,
      nameEn,
    }
  } catch (error) {
    console.error('Error generating certificate:', error)
    return { url: null, buffer: null, nameEn: opts.studentName }
  }
}