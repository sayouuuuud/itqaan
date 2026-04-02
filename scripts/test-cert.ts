import sharp from 'sharp'
import path from 'path'

async function run() {
  const CERT_TEMPLATE = path.join(process.cwd(), 'Certificate.png')
  const width = 2528
  const height = 1684

  let svgLines = ''
  
  // Vertical lines every 100px
  for (let x = 0; x < width; x += 100) {
    svgLines += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="rgba(255,0,0,0.5)" stroke-width="2"/>`
    svgLines += `<text x="${x + 5}" y="30" fill="red" font-size="20">${x}</text>`
  }

  // Horizontal lines every 100px
  for (let y = 0; y < height; y += 100) {
    svgLines += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="rgba(0,0,255,0.5)" stroke-width="2"/>`
    svgLines += `<text x="10" y="${y - 5}" fill="blue" font-size="20">${y}</text>`
  }

  const svg = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      ${svgLines}
    </svg>
  `)

  await sharp(CERT_TEMPLATE)
    .composite([{ input: svg, top: 0, left: 0 }])
    .toFile(path.join(process.cwd(), 'test-coord.png'))

  console.log('test-coord.png generated')
}

run().catch(console.error)
