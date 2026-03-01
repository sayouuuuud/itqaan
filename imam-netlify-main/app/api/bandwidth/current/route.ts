import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function GET() {
  try {
    // Fetch usage data from Cloudinary Admin API
    const result = await cloudinary.api.usage()


    // Extract relevant data
    // Cloudinary returns bandwidth in bytes
    const bandwidth = result.bandwidth || {}
    const credits = result.credits || {}
    const storage = result.storage || {}
    const plan = result.plan || 'Free'
    const lastUpdated = result.last_updated || new Date().toISOString()

    // Determine Limit and Usage
    // For Free plans, limits are often in 'credits' (1 credit ~= 1 GB bandwidth)
    let limitBytes = bandwidth.limit

    // Explicitly check if we have a valid limit (greater than 0)
    const hasExplicitLimit = limitBytes && limitBytes > 0

    // For Free plans on Cloudinary, bandwidth limit is often 0 or undefined.
    // However, they have a 'credits' system where usage is aggregated.
    // If no explicit bandwidth limit, we can fallback to displaying usage against credits limit if desired,
    // OR just return 0 to indicate "unlimited/shared".
    // Better approach: If limitBytes is 0, try to assume usage against the Plan's Credit Limit converted to Bytes.
    // 1 Credit approx 1 GB.

    if (!hasExplicitLimit && credits.limit) {
      // Fallback: Use Credits Limit as proxy for Bandwidth Limit
      // 1 Credit = 1 GB = 1073741824 bytes
      // Note: Cloudinary says 1 credit = 1GB bandwidth OR 1GB storage.
      // So the limit applies to the sum of usages.
      limitBytes = credits.limit * 1024 * 1024 * 1024
    }

    // Determine Used Percent
    // If we fell back to credits, we should ideally use the credits' used_percent 
    // because that reflects the true account pressure (storage + bandwidth).
    let usedPercent = bandwidth.used_percent
    if (!hasExplicitLimit && credits.used_percent) {
      usedPercent = credits.used_percent
    }

    return NextResponse.json({
      plan,
      last_updated: lastUpdated,
      bandwidth: {
        usage: bandwidth.usage || 0,
        limit: limitBytes || 0,
        used_percent: usedPercent || 0,
        credits_limit: credits.limit
      },
      storage: {
        usage: storage.usage || 0
      }
    })
  } catch (error: any) {
    console.error('Error fetching Cloudinary usage:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bandwidth data', details: error.message },
      { status: 500 }
    )
  }
}
