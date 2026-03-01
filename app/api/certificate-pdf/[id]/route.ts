import { NextResponse } from "next/server"
import { queryOne } from "@/lib/db"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Get certificate data
    const certData = await queryOne<{
      student_id: string;
      certificate_issued: boolean;
      university: string;
      city: string;
      student_name: string;
      issued_date: Date;
    }>(
      `SELECT cd.student_id, cd.certificate_issued, cd.university, cd.city, cd.updated_at as issued_date, u.name as student_name
     FROM certificate_data cd
     JOIN users u ON u.id = cd.student_id
     WHERE cd.student_id = $1`,
      [id]
    )

    if (!certData || !certData.certificate_issued) {
      return NextResponse.json({ error: "Certificate not found or not issued" }, { status: 404 })
    }

    const formattedDate = new Date(certData.issued_date).toLocaleDateString('ar-SA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    // Generate HTML for certificate
    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>شهادة إتقان الفاتحة</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
    body {
      font-family: 'Cairo', Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: #f8fafc;
      direction: rtl;
    }
    .certificate-container {
      position: relative;
      width: 210mm;
      height: 297mm;
      background: white;
      margin: 20px auto;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .certificate-container::before {
      content: '';
      position: absolute;
      top: 32px;
      left: 32px;
      right: 32px;
      bottom: 32px;
      border: 6px double #D4A843;
      border-radius: 8px;
      pointer-events: none;
    }
    .certificate-content {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 60px 40px;
      text-align: center;
    }
    .header {
      margin-bottom: 48px;
    }
    .logo {
      width: 96px;
      height: 96px;
      background: #0B3D2E;
      border-radius: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      transform: rotate(45deg);
    }
    .logo svg {
      width: 48px;
      height: 48px;
      color: #D4A843;
      transform: rotate(-45deg);
    }
    .platform-title {
      font-size: 36px;
      font-weight: 900;
      color: #0B3D2E;
      margin-bottom: 8px;
      letter-spacing: -1px;
    }
    .platform-subtitle {
      color: #D4A843;
      font-weight: 700;
      font-size: 20px;
      letter-spacing: 2px;
    }
    .divider {
      width: 128px;
      height: 4px;
      background: rgba(212, 168, 67, 0.2);
      margin: 32px 0;
    }
    .main-text {
      margin-bottom: 32px;
      line-height: 1.6;
    }
    .recipient-title {
      font-size: 24px;
      color: #374151;
      font-style: italic;
      margin-bottom: 16px;
    }
    .recipient-name {
      font-size: 72px;
      font-weight: 900;
      color: #0B3D2E;
      text-decoration: underline;
      text-decoration-color: rgba(212, 168, 67, 0.4);
      text-underline-offset: 16px;
      margin-bottom: 48px;
      line-height: 1.1;
    }
    .achievement-text {
      font-size: 24px;
      color: #4B5563;
      line-height: 1.7;
      max-width: 800px;
      margin-bottom: 80px;
    }
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px 80px;
      margin-bottom: 80px;
      width: 100%;
      max-width: 640px;
      text-align: right;
    }
    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .detail-label {
      font-size: 14px;
      font-weight: 700;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 1px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .detail-value {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
    }
    .footer {
      margin-top: auto;
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: end;
    }
    .seal {
      text-align: center;
    }
    .seal img {
      width: 96px;
      height: 96px;
      border: 4px solid #E5E7EB;
      border-radius: 50%;
      margin-bottom: 8px;
      filter: grayscale(100%) opacity(0.5);
    }
    .seal-text {
      font-size: 12px;
      font-weight: 700;
      color: #6B7280;
    }
    .signature-section {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .signature-title {
      font-size: 20px;
      font-weight: 700;
      color: #0B3D2E;
      border-bottom: 2px solid #D4A843;
      padding-bottom: 4px;
      margin-bottom: 16px;
    }
    .signature-dots {
      display: flex;
      gap: 4px;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #D4A843;
    }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(12deg);
      font-size: 400px;
      color: rgba(212, 168, 67, 0.03);
      pointer-events: none;
      z-index: -1;
    }
    @media print {
      body {
        background: white !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .certificate-container {
        width: 100% !important;
        height: 100vh !important;
        margin: 0 !important;
        border: none !important;
        box-shadow: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="certificate-container">
    <div class="certificate-content">
      <div class="header">
        <div class="logo">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
        <h1 class="platform-title">منصة إتقان الفاتحة</h1>
        <p class="platform-subtitle">مبادرة تصحيح وذكر</p>
      </div>

      <div class="divider"></div>

      <div class="main-text">
        <h2 class="recipient-title">يُمنح هذا التبرير لـ</h2>
        <h3 class="recipient-name">${certData.student_name}</h3>
        <p class="achievement-text">
          وذلك تقديراً لإتمامه إتقان قراءة سورة الفاتحة على الوجه المطلوب والمجاز من قبل اللجان العلمية بالمنصة.
        </p>
      </div>

      <div class="details-grid">
        <div class="detail-item">
          <span class="detail-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            الجهة التابع لها
          </span>
          <span class="detail-value">${certData.university || 'غير محدد'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            المدينة
          </span>
          <span class="detail-value">${certData.city || 'غير محدد'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm2-7h-1V6H8v1H7V6H5V8h14V7z"/>
            </svg>
            تاريخ الإصدار
          </span>
          <span class="detail-value">${formattedDate}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm3 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            </svg>
            رمز الموثوقية
          </span>
          <span class="detail-value">${id.slice(0, 8).toUpperCase()}</span>
        </div>
      </div>

      <div class="footer">
        <div class="seal">
          <div style="width: 96px; height: 96px; border: 4px solid #E5E7EB; border-radius: 50%; margin: 0 auto 8px; display: flex; align-items: center; justify-content: center; background: #f9fafb;">
            <span style="font-size: 24px; color: #6B7280;">★</span>
          </div>
          <p class="seal-text">ختم المنصة</p>
        </div>

        <div class="signature-section">
          <p class="signature-title">إدارة مبادرة إتقان</p>
          <div class="signature-dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
        </div>
      </div>

      <div class="watermark">★</div>
    </div>
  </div>
</body>
</html>`

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })

  } catch (error) {
    console.error("Generate certificate HTML error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
