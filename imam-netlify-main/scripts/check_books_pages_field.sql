-- Check if pages field exists in books table

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'books'
AND table_schema = 'public'
AND column_name = 'pages';

-- Also show a sample of books with pages field
SELECT
    id,
    title,
    pages,
    created_at
FROM public.books
WHERE pages IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;





















