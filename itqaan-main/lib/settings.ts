import { query } from "./db"

// Simple in-memory cache for settings
const settingsCache: Record<string, { value: any; expiry: number }> = {}
const CACHE_TTL = 60 * 1000 // 1 minute cache to balance performance and freshness

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
    const now = Date.now()

    // Check cache first
    if (settingsCache[key] && settingsCache[key].expiry > now) {
        return settingsCache[key].value as T
    }

    try {
        const rows = await query(`SELECT setting_value FROM system_settings WHERE setting_key = $1`, [key])

        if (rows.length > 0 && rows[0].setting_value !== null) {
            const value = rows[0].setting_value as T
            // Update cache
            settingsCache[key] = { value, expiry: now + CACHE_TTL }
            return value
        }
    } catch (error) {
        console.error(`Error fetching setting ${key}:`, error)
    }

    return defaultValue
}

// Specific helper for SMTP to build the connection string
export async function getSmtpUrl(): Promise<string | undefined> {
    // First check dynamic settings
    const smtpConfig = await getSetting<any>("smtp_config", null)

    if (smtpConfig && smtpConfig.host && smtpConfig.port && smtpConfig.user && smtpConfig.password) {
        // Format: smtps://user:pass@smtp.gmail.com
        const protocol = smtpConfig.secure ? 'smtps' : 'smtp'
        const encodedUser = encodeURIComponent(smtpConfig.user)
        const encodedPass = encodeURIComponent(smtpConfig.password)
        return `${protocol}://${encodedUser}:${encodedPass}@${smtpConfig.host}:${smtpConfig.port}`
    }

    // Fallback to environment variable
    return process.env.SMTP_CONNECTION_URL
}

export async function getSmtpFromEmail(): Promise<string> {
    const smtpConfig = await getSetting<any>("smtp_config", null)
    if (smtpConfig && smtpConfig.fromEmail) {
        return smtpConfig.fromName
            ? `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`
            : smtpConfig.fromEmail
    }

    return '"إتقان الفاتحة" <itz4kairo@gmail.com>' // Default fallback
}

// Helper for Cloudinary
export async function getCloudinaryConfig() {
    const config = await getSetting<any>("cloudinary_config", null)

    if (config && config.cloudName && config.apiKey && config.apiSecret) {
        return {
            cloud_name: config.cloudName,
            api_key: config.apiKey,
            api_secret: config.apiSecret,
        }
    }

    // Fallback to env
    return {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    }
}
