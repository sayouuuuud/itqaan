
/**
 * Utility for geolocation and device detection
 */

export function getDetailedDeviceType(ua: string): string {
    if (!ua) return 'Unknown Device'
    const uaL = ua.toLowerCase()
    
    // Bots
    if (/bot|crawl|spider|slurp|facebookexternalhit/i.test(uaL)) return 'Bot/Crawler'
    
    // OS Detection
    let os = 'Unknown OS'
    if (uaL.includes('windows phone')) os = 'Windows Phone'
    else if (uaL.includes('windows')) os = 'Windows'
    else if (uaL.includes('android')) os = 'Android'
    else if (uaL.includes('iphone')) os = 'iPhone'
    else if (uaL.includes('ipad')) os = 'iPad'
    else if (uaL.includes('ipod')) os = 'iPod'
    else if (uaL.includes('mac os')) os = 'macOS'
    else if (uaL.includes('linux')) os = 'Linux'
    
    // Browser Detection
    let browser = 'Unknown Browser'
    if (uaL.includes('edg/')) browser = 'Edge'
    else if (uaL.includes('opr/') || uaL.includes('opera/')) browser = 'Opera'
    else if (uaL.includes('chrome/')) browser = 'Chrome'
    else if (uaL.includes('firefox/')) browser = 'Firefox'
    else if (uaL.includes('safari/') && !uaL.includes('chrome')) browser = 'Safari'
    
    // Version Detection (Subtle)
    let version = ''
    if (browser === 'Chrome') {
        const match = ua.match(/Chrome\/([0-9.]+)/)
        if (match) version = ` ${match[1].split('.')[0]}`
    } else if (browser === 'Firefox') {
        const match = ua.match(/Firefox\/([0-9.]+)/)
        if (match) version = ` ${match[1].split('.')[0]}`
    } else if (browser === 'Safari') {
        const match = ua.match(/Version\/([0-9.]+)/)
        if (match) version = ` ${match[1].split('.')[0]}`
    }
    
    // Device Category
    let category = 'Desktop'
    if (/tablet|ipad|kindle|playbook/i.test(uaL)) category = 'Tablet'
    else if (/mobile|iphone|android.*phone|windows phone/i.test(uaL)) category = 'Mobile'
    
    return `${browser}${version} — ${os} (${category})`
}

export async function getCountryFromIp(ip: string): Promise<string | null> {
    if (!ip) return null
    if (ip === '::1' || ip === '127.0.0.1') return 'الاستضافة المحلية (Localhost)'
    
    // Internal IP detection
    if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.16.') || ip.startsWith('172.31.')) {
        return 'شبكة داخلية (Internal Network)'
    }
    
    try {
        // Use ip-api.com (Free, no API key, supports country, city, isp)
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,isp`)
        if (response.ok) {
            const data = await response.json()
            if (data.status === 'success') {
                const country = data.country || ''
                const city = data.city || ''
                const isp = data.isp ? ` [${data.isp}]` : ''
                
                if (country && city) return `${country}, ${city}${isp}`
                if (country) return `${country}${isp}`
            }
        }
    } catch (error) {
        console.error('[GeoIP] Failed to fetch country from ip-api:', error)
    }
    
    return 'N/A'
}
