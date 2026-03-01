
export type SchemaType = {
    '@context': string;
    '@type': string;
    [key: string]: any;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://elsayed-mourad.online';
const AUTHOR_NAME = 'الشيخ السيد مراد';
const AUTHOR_URL = SITE_URL;

export function formatDurationToISO(durationStr?: string): string | undefined {
    if (!durationStr) return undefined;
    const parts = durationStr.split(':').map(Number);
    if (parts.length === 2) return `PT${parts[0]}M${parts[1]}S`;
    if (parts.length === 3) return `PT${parts[0]}H${parts[1]}M${parts[2]}S`;
    return undefined;
}

export function generateBreadcrumbSchema(items: { name: string; item: string }[]): SchemaType {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.item.startsWith('http') ? item.item : `${SITE_URL}${item.item.startsWith('/') ? '' : '/'}${item.item}`,
        })),
    };
}

export function generateArticleSchema({
    title,
    description,
    url,
    image,
    datePublished,
    dateModified,
    authorName = AUTHOR_NAME,
    authorUrl = AUTHOR_URL,
}: {
    title: string;
    description?: string;
    url: string;
    image?: string;
    datePublished: string;
    dateModified?: string;
    authorName?: string;
    authorUrl?: string;
}): SchemaType {
    return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: title,
        description: description,
        image: image ? [image] : undefined,
        datePublished: datePublished,
        dateModified: dateModified || datePublished,
        author: {
            '@type': 'Person',
            name: authorName,
            url: authorUrl,
        },
        publisher: {
            '@type': 'Organization',
            name: AUTHOR_NAME,
            logo: {
                '@type': 'ImageObject',
                url: `${SITE_URL}/icon.png`,
            },
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': url.startsWith('http') ? url : `${SITE_URL}${url}`,
        },
    };
}

export function generateBookSchema({
    title,
    description,
    url,
    image,
    authorName = AUTHOR_NAME,
    isbn,
    datePublished,
}: {
    title: string;
    description?: string;
    url: string;
    image?: string;
    authorName?: string;
    isbn?: string;
    datePublished?: string;
}): SchemaType {
    return {
        '@context': 'https://schema.org',
        '@type': 'Book',
        name: title,
        description: description,
        image: image,
        url: url.startsWith('http') ? url : `${SITE_URL}${url}`,
        author: {
            '@type': 'Person',
            name: authorName,
        },
        isbn: isbn,
        datePublished: datePublished,
    };
}

export function generateVideoSchema({
    title,
    description,
    uploadDate,
    thumbnailUrl,
    contentUrl,
    embedUrl,
    duration,
}: {
    title: string;
    description: string;
    uploadDate: string;
    thumbnailUrl: string;
    contentUrl?: string;
    embedUrl?: string;
    duration?: string;
}): SchemaType {
    return {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: title,
        description: description,
        uploadDate: uploadDate,
        thumbnailUrl: thumbnailUrl,
        contentUrl: contentUrl,
        embedUrl: embedUrl,
        duration: duration,
    };
}

export function generateAudioSchema({
    title,
    description,
    uploadDate,
    contentUrl,
    duration,
}: {
    title: string;
    description?: string;
    uploadDate: string;
    contentUrl: string;
    duration?: string;
}): SchemaType {
    return {
        '@context': 'https://schema.org',
        '@type': 'AudioObject',
        name: title,
        description: description,
        uploadDate: uploadDate,
        contentUrl: contentUrl,
        duration: duration,
    };
}

export function generateWebsiteSchema(): SchemaType {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'الشيخ السيد مراد',
        url: SITE_URL,
        potentialAction: {
            '@type': 'SearchAction',
            target: `${SITE_URL}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string'
        }
    }
}

export function generateSearchResultsSchema(query: string, resultsCount: number): SchemaType {
    return {
        '@context': 'https://schema.org',
        '@type': 'SearchResultsPage',
        mainEntity: {
            '@type': 'ItemList',
            numberOfItems: resultsCount,
            itemListOrder: 'Descending',
            url: `${SITE_URL}/search?q=${encodeURIComponent(query)}`
        }
    }
}

export function generatePersonSchema(): SchemaType {
    return {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: AUTHOR_NAME,
        url: AUTHOR_URL,
        image: `${SITE_URL}/logo.png`,
        jobTitle: "عالم أزهري وإمام وخطيب",
        description: "الموقع الرسمي للشيخ السيد مراد - منصة إسلامية شاملة تضم الخطب والدروس العلمية والمقالات والكتب."
    }
}

