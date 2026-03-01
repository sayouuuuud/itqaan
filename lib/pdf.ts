import puppeteer from 'puppeteer'
import { uploadToCloudinary } from './cloudinary'

export async function generateCertificatePDF(certificateUrl: string, studentId: string): Promise<string | null> {
  let browser
  try {
    console.log('Starting PDF generation for student:', studentId)

    // Fetch server-rendered HTML
    const htmlUrl = certificateUrl.replace('/c/', '/api/certificate-pdf/')
    console.log('Fetching HTML from:', htmlUrl)
    const htmlResponse = await fetch(htmlUrl)
    if (!htmlResponse.ok) {
      throw new Error(`Failed to fetch certificate HTML: ${htmlResponse.status}`)
    }
    const html = await htmlResponse.text()
    console.log('HTML fetched, length:', html.length)

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()

    // Set viewport to A4
    await page.setViewport({
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123, // A4 height in pixels at 96 DPI
      deviceScaleFactor: 1,
    })

    console.log('Setting HTML content...')
    // Set the HTML content
    await page.setContent(html, { waitUntil: 'networkidle2' })

    console.log('Waiting for content to render...')
    // Wait for content to render
    await new Promise(resolve => setTimeout(resolve, 1000))

    console.log('Generating PDF...')
    // Generate PDF buffer
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px'
      }
    })

    console.log('PDF generated, buffer length:', pdfBuffer.length)

    // Upload to Cloudinary
    const fileName = `certificate-${studentId}-${Date.now()}.pdf`
    console.log('Uploading to Cloudinary...')
    const uploadResult = await uploadToCloudinary(pdfBuffer, {
      folder: 'certificates',
      resource_type: 'raw', // PDF is raw file
      public_id: fileName
    })

    console.log('Upload result:', uploadResult)

    return uploadResult?.url || null

  } catch (error) {
    console.error('Error generating certificate PDF:', error)
    return null
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}
