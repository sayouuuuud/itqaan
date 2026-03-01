import { NextResponse } from "next/server"
import { UTApi } from "uploadthing/server"

export const runtime = "nodejs"

export async function GET() {
    try {
        const utapi = new UTApi()
        const usage = await utapi.getUsageInfo()

        // 1. Basic Stats
        const total = usage.limitBytes || (2 * 1024 * 1024 * 1024)
        const used = usage.appTotalBytes || 0
        const filesUploaded = usage.filesUploaded || 0
        const remaining = Math.max(0, total - used)
        const percent = Math.min((used / total) * 100, 100)

        // 2. Real History (Last 30 days)
        const fileList = await utapi.listFiles({ limit: 500 })

        // 3. Setup History with Manual Data Overrides
        const history: Record<string, number> = {}
        const now = new Date()

        // Manual data provided by the user for January 2026
        const manualData: Record<string, number> = {
            "2026-01-29": 99,
            "2026-01-26": 75,
            "2026-01-25": 5,
            "2026-01-24": 11,
            "2026-01-23": 3,
            "2026-01-22": 36,
            "2026-01-21": 4,
            "2026-01-20": 5,
        }

        // Initialize 30-day range
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now)
            d.setDate(now.getDate() - i)
            const dateStr = d.toISOString().split('T')[0]

            // Use manual data if available, otherwise 0
            history[dateStr] = manualData[dateStr] || 0
        }

        // 4. Aggregate NEW/Other real data (Only PDF and Images)
        // We only add files that were NOT part of the manual data period 
        // OR simply add them to future dates.
        if (fileList && fileList.files) {
            fileList.files.forEach(file => {
                const name = (file.name || file.key).toLowerCase()
                const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/.test(name)
                const isPdf = /\.pdf$/.test(name)

                if (isImage || isPdf) {
                    const date = new Date(file.uploadedAt)
                    const dateStr = date.toISOString().split('T')[0]

                    // If date is NOT in the manualData list, count it automatically
                    // This ensures historical accuracy for those specific dates while still tracking everything else.
                    if (history[dateStr] !== undefined && !manualData[dateStr]) {
                        history[dateStr]++
                    }
                }
            })
        }

        // Convert record to sorted array for the chart
        const historyArray = Object.entries(history).map(([date, count]) => ({
            date,
            count
        })).sort((a, b) => a.date.localeCompare(b.date))

        return NextResponse.json({
            totalBytes: total,
            usedBytes: used,
            remainingBytes: remaining,
            percentUsed: percent,
            filesCount: filesUploaded,
            history: historyArray
        })
    } catch (error: any) {
        console.error("UT API Error:", error)
        return NextResponse.json({
            totalBytes: 2 * 1024 * 1024 * 1024,
            usedBytes: 0,
            remainingBytes: 2 * 1024 * 1024 * 1024,
            percentUsed: 0,
            filesCount: 0,
            history: [],
            error: error.message
        })
    }
}
