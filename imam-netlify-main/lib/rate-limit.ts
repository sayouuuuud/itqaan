/**
 * Rate Limiting for Bandwidth Protection
 * 
 * Uses in-memory storage for development.
 * For production, consider using Redis or a database-backed solution.
 */

interface RateLimitEntry {
    count: number
    firstRequestTime: number
    blocked: boolean
    blockedUntil?: number
}

// In-memory store (per-process, resets on restart)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Configuration
const RATE_LIMITS = {
    books: {
        maxRequests: 10,
        windowMs: 60 * 1000, // 1 minute
        blockDurationMs: 5 * 60 * 1000 // 5 minutes
    },
    audio: {
        maxRequests: 5,
        windowMs: 60 * 1000, // 1 minute
        blockDurationMs: 5 * 60 * 1000 // 5 minutes
    }
}

const REPEATED_VIOLATION_THRESHOLD = 3
const EXTENDED_BLOCK_DURATION = 60 * 60 * 1000 // 1 hour

// Track violations per IP
const violationStore = new Map<string, { count: number; lastViolation: number }>()

interface RateLimitResult {
    allowed: boolean
    remaining: number
    resetIn: number
    blockedUntil?: Date
    reason?: string
}

/**
 * Check if a request should be rate limited
 */
export function checkRateLimit(ip: string, contentType: 'books' | 'audio'): RateLimitResult {
    const now = Date.now()
    const config = RATE_LIMITS[contentType]
    const key = `${ip}:${contentType}`

    // Get or create entry
    let entry = rateLimitStore.get(key)

    // Check if currently blocked
    if (entry?.blocked && entry.blockedUntil && now < entry.blockedUntil) {
        return {
            allowed: false,
            remaining: 0,
            resetIn: Math.ceil((entry.blockedUntil - now) / 1000),
            blockedUntil: new Date(entry.blockedUntil),
            reason: 'تم حظرك مؤقتاً بسبب كثرة الطلبات'
        }
    }

    // Reset if window expired or was blocked but block expired
    if (!entry || now - entry.firstRequestTime > config.windowMs ||
        (entry.blocked && entry.blockedUntil && now >= entry.blockedUntil)) {
        entry = {
            count: 0,
            firstRequestTime: now,
            blocked: false
        }
    }

    // Increment count
    entry.count++

    // Check if exceeded
    if (entry.count > config.maxRequests) {
        // Record violation
        const violations = violationStore.get(ip) || { count: 0, lastViolation: 0 }

        // Reset violation count if last violation was more than 1 hour ago
        if (now - violations.lastViolation > 60 * 60 * 1000) {
            violations.count = 0
        }

        violations.count++
        violations.lastViolation = now
        violationStore.set(ip, violations)

        // Determine block duration
        const blockDuration = violations.count >= REPEATED_VIOLATION_THRESHOLD
            ? EXTENDED_BLOCK_DURATION
            : config.blockDurationMs

        entry.blocked = true
        entry.blockedUntil = now + blockDuration
        rateLimitStore.set(key, entry)

        return {
            allowed: false,
            remaining: 0,
            resetIn: Math.ceil(blockDuration / 1000),
            blockedUntil: new Date(entry.blockedUntil),
            reason: violations.count >= REPEATED_VIOLATION_THRESHOLD
                ? 'تم حظرك لمدة ساعة بسبب محاولات متكررة'
                : `تم حظرك لمدة ${config.blockDurationMs / 60000} دقائق`
        }
    }

    rateLimitStore.set(key, entry)

    return {
        allowed: true,
        remaining: config.maxRequests - entry.count,
        resetIn: Math.ceil((entry.firstRequestTime + config.windowMs - now) / 1000)
    }
}

/**
 * Get IP address from request headers
 */
export function getClientIP(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for')
    if (forwarded) {
        return forwarded.split(',')[0].trim()
    }

    const realIp = request.headers.get('x-real-ip')
    if (realIp) {
        return realIp
    }

    // Fallback for development
    return '127.0.0.1'
}

/**
 * Clean up old entries (call periodically)
 */
export function cleanupRateLimitStore() {
    const now = Date.now()
    const maxAge = 60 * 60 * 1000 // 1 hour

    for (const [key, entry] of rateLimitStore.entries()) {
        if (now - entry.firstRequestTime > maxAge) {
            rateLimitStore.delete(key)
        }
    }

    for (const [ip, violation] of violationStore.entries()) {
        if (now - violation.lastViolation > 24 * 60 * 60 * 1000) { // 24 hours
            violationStore.delete(ip)
        }
    }
}

// Cleanup every 10 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(cleanupRateLimitStore, 10 * 60 * 1000)
}
