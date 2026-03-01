import { MetadataRoute } from 'next'
import { createPublicClient } from '@/lib/supabase/public'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://elsayed-mourad.online'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = createPublicClient()

    // 1. Static Pages
    const routes = [
        '',
        '/about',
        '/contact',
        '/articles',
        '/dars',
        '/khutba',
        '/books',
        '/videos',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }))

    // 2. Dynamic Content: Articles
    const { data: articles } = await supabase
        .from('articles')
        .select('id, updated_at')
        .eq('publish_status', 'published')

    const articleRoutes = (articles || []).map((article) => ({
        url: `${baseUrl}/articles/${article.id}`,
        lastModified: article.updated_at,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }))

    // 3. Dynamic Content: Lessons
    const { data: lessons } = await supabase
        .from('lessons')
        .select('id, updated_at')

    const lessonRoutes = (lessons || []).map((lesson) => ({
        url: `${baseUrl}/dars/${lesson.id}`,
        lastModified: lesson.updated_at,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }))

    // 4. Dynamic Content: Sermons
    const { data: sermons } = await supabase
        .from('sermons')
        .select('id, date') // Sermons often don't have updated_at initially, user date or created_at

    const sermonRoutes = (sermons || []).map((sermon) => ({
        url: `${baseUrl}/khutba/${sermon.id}`,
        lastModified: new Date().toISOString(), // Fallback
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }))

    // 5. Dynamic Content: Books
    const { data: books } = await supabase
        .from('books')
        .select('id, created_at')

    const bookRoutes = (books || []).map((book) => ({
        url: `${baseUrl}/books/${book.id}`,
        lastModified: book.created_at || new Date().toISOString(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
    }))

    return [...routes, ...articleRoutes, ...lessonRoutes, ...sermonRoutes, ...bookRoutes]
}
