import { v2 as cloudinary } from "cloudinary"
import { getCloudinaryConfig } from "./settings"

async function ensureConfigured() {
    const config = await getCloudinaryConfig()
    cloudinary.config({
        cloud_name: config.cloud_name,
        api_key: config.api_key,
        api_secret: config.api_secret,
    })
}

export interface UploadResult {
    url: string
    public_id: string
    resource_type: string
    format: string
    bytes: number
    duration?: number
}

export async function uploadToCloudinary(
    buffer: Buffer,
    options: {
        folder?: string
        resource_type?: "image" | "video" | "raw" | "auto"
        public_id?: string
        format?: string
    } = {}
): Promise<UploadResult> {
    await ensureConfigured()
    return new Promise((resolve, reject) => {
        const uploadOptions = {
            folder: options.folder || "uploads",
            resource_type: (options.resource_type || "auto") as "image" | "video" | "raw" | "auto",
            ...(options.public_id && { public_id: options.public_id }),
        }

        cloudinary.uploader
            .upload_stream(uploadOptions, (error, result) => {
                if (error) reject(error)
                else if (result) {
                    resolve({
                        url: result.secure_url,
                        public_id: result.public_id,
                        resource_type: result.resource_type,
                        format: result.format,
                        bytes: result.bytes,
                        duration: (result as any).duration,
                    })
                } else {
                    reject(new Error("Upload returned no result"))
                }
            })
            .end(buffer)
    })
}

export async function deleteFromCloudinary(
    publicId: string,
    resourceType: "image" | "video" | "raw" = "video"
): Promise<{ result: string }> {
    await ensureConfigured()
    return new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(
            publicId,
            { resource_type: resourceType },
            (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(result)
                }
            }
        )
    })
}

export default cloudinary
