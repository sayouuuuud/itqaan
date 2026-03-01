
import Script from 'next/script'
import { SchemaType } from '@/lib/schema-generator'

export function JsonLd({ schema }: { schema: SchemaType | SchemaType[] }) {
    return (
        <Script
            id={`json-ld-${Math.random().toString(36).substr(2, 9)}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    )
}
