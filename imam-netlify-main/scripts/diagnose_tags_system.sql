-- تشخيص شامل لنظام التاجات
-- يمكن تشغيله للتحقق من حالة النظام

-- 1. فحص هيكل جدول tags
SELECT
    'Tags Table Structure' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'tags' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. فحص هيكل جدول article_tags
SELECT
    'Article Tags Table Structure' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'article_tags' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. فحص القيود الخارجية
SELECT
    'Foreign Key Constraints' as info,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
LEFT JOIN information_schema.referential_constraints AS rc ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND (tc.table_name = 'article_tags' OR tc.table_name = 'tags')
ORDER BY tc.table_name, kcu.column_name;

-- 4. فحص البيانات الموجودة
SELECT
    'Data Check' as info,
    (SELECT COUNT(*) FROM public.tags) as tags_count,
    (SELECT COUNT(*) FROM public.articles) as articles_count,
    (SELECT COUNT(*) FROM public.article_tags) as article_tags_count;

-- 5. فحص عينة من البيانات
SELECT
    'Sample Data - Tags' as info,
    id, name, slug
FROM public.tags
LIMIT 5;

SELECT
    'Sample Data - Article Tags' as info,
    at.article_id, at.tag_id, t.name as tag_name, a.title as article_title
FROM public.article_tags at
JOIN public.tags t ON at.tag_id = t.id
JOIN public.articles a ON at.article_id = a.id
LIMIT 10;

-- 6. فحص الأخطاء المحتملة
SELECT
    'Potential Issues' as info,
    CASE
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tags') THEN 'Tags table missing'
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'article_tags') THEN 'Article_tags table missing'
        WHEN NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'article_tags' AND kcu.column_name = 'article_id'
        ) THEN 'Missing foreign key for article_id'
        WHEN NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'article_tags' AND kcu.column_name = 'tag_id'
        ) THEN 'Missing foreign key for tag_id'
        ELSE 'System appears to be working correctly'
    END as status;

-- يمكن تشغيله للتحقق من حالة النظام

-- 1. فحص هيكل جدول tags
SELECT
    'Tags Table Structure' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'tags' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. فحص هيكل جدول article_tags
SELECT
    'Article Tags Table Structure' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'article_tags' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. فحص القيود الخارجية
SELECT
    'Foreign Key Constraints' as info,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
LEFT JOIN information_schema.referential_constraints AS rc ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND (tc.table_name = 'article_tags' OR tc.table_name = 'tags')
ORDER BY tc.table_name, kcu.column_name;

-- 4. فحص البيانات الموجودة
SELECT
    'Data Check' as info,
    (SELECT COUNT(*) FROM public.tags) as tags_count,
    (SELECT COUNT(*) FROM public.articles) as articles_count,
    (SELECT COUNT(*) FROM public.article_tags) as article_tags_count;

-- 5. فحص عينة من البيانات
SELECT
    'Sample Data - Tags' as info,
    id, name, slug
FROM public.tags
LIMIT 5;

SELECT
    'Sample Data - Article Tags' as info,
    at.article_id, at.tag_id, t.name as tag_name, a.title as article_title
FROM public.article_tags at
JOIN public.tags t ON at.tag_id = t.id
JOIN public.articles a ON at.article_id = a.id
LIMIT 10;

-- 6. فحص الأخطاء المحتملة
SELECT
    'Potential Issues' as info,
    CASE
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tags') THEN 'Tags table missing'
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'article_tags') THEN 'Article_tags table missing'
        WHEN NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'article_tags' AND kcu.column_name = 'article_id'
        ) THEN 'Missing foreign key for article_id'
        WHEN NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'article_tags' AND kcu.column_name = 'tag_id'
        ) THEN 'Missing foreign key for tag_id'
        ELSE 'System appears to be working correctly'
    END as status;

