import { MetadataRoute } from 'next'

const baseUrl = 'https://elsayed-mourad.online' // Should be dynamic based on environment

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/private/'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
