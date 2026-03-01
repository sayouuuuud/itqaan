import { NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from 'cloudinary'
import { promises as fs } from 'fs'
import path from 'path'
import { extractPublicIdFromUrl } from "@/lib/storage/cloudinary"

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const runtime = 'nodejs'
// Allow 5 minutes
export const maxDuration = 300

export async function GET(request: NextRequest) {
    try {
        console.log("⚠️ Starting Strict Allowlist Cleanup")

        // 1. Load the raw data
        const rawDataPath = path.join(process.cwd(), 'safe_audio_raw_data.json')
        const rawData = JSON.parse(await fs.readFile(rawDataPath, 'utf8'))

        const safePublicIds = new Set<string>()

        // 2. Process manifests to build the safelist
        for (const item of rawData) {
            if (item.media_url && item.media_url.startsWith('manifest:')) {
                const manifestUrl = item.media_url.replace('manifest:', '')
                console.log(`Processing manifest: ${manifestUrl}`)

                // Add manifest itself to safe list
                const manifestId = extractPublicIdFromUrl(manifestUrl)?.publicId
                if (manifestId) safePublicIds.add(manifestId)

                // Fetch manifest content to get chunks
                try {
                    const res = await fetch(manifestUrl)
                    if (res.ok) {
                        const json = await res.json()
                        if (json.chunks && Array.isArray(json.chunks)) {
                            for (const chunkUrl of json.chunks) {
                                const chunkId = extractPublicIdFromUrl(chunkUrl)?.publicId
                                if (chunkId) safePublicIds.add(chunkId)
                            }
                        }
                    }
                } catch (err) {
                    console.error(`Failed to fetch manifest: ${manifestUrl}`, err)
                }
            }
        }

        console.log(`🛡️ Safelist built: ${safePublicIds.size} files to KEEP.`)

        let deletedCount = 0
        const keptFiles = []
        const deletedFiles = []

        // 3. Iterate Cloudinary and Delete anything NOT in safelist
        // We check 'raw', 'image', and 'video' (just in case)
        const resourceTypes = ['raw', 'image', 'video']

        for (const type of resourceTypes) {
            let cursor = null
            do {
                const result: any = await cloudinary.api.resources({
                    resource_type: type,
                    type: 'upload',
                    max_results: 100,
                    next_cursor: cursor
                })

                const resources = result.resources
                cursor = result.next_cursor

                const toDelete = []

                for (const res of resources) {
                    if (safePublicIds.has(res.public_id)) {
                        console.log(`🛡️ KEEPING: ${res.public_id}`)
                        keptFiles.push(res.public_id)
                    } else {
                        toDelete.push(res.public_id)
                    }
                }

                if (toDelete.length > 0) {
                    console.log(`Deleting ${toDelete.length} ${type} resources...`)
                    await cloudinary.api.delete_resources(toDelete, { resource_type: type })
                    deletedCount += toDelete.length
                    deletedFiles.push(...toDelete)
                }

            } while (cursor)
        }

        return NextResponse.json({
            success: true,
            deletedCount,
            keptCount: keptFiles.length,
            message: `Deleted ${deletedCount} files. Kept ${keptFiles.length} safe files.`,
            keptFiles: keptFiles.slice(0, 50)
        })

    } catch (error: any) {
        console.error('Safe Cleanup failed:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
