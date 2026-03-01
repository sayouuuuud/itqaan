    -- Verify that article_tags table has correct data types

    -- Check article_tags table structure
    SELECT
        column_name,
        data_type,
        is_nullable
    FROM
        information_schema.columns
    WHERE
        table_name = 'article_tags'
        AND table_schema = 'public'
    ORDER BY ordinal_position;

    -- Check tags table structure
    SELECT
        column_name,
        data_type,
        is_nullable
    FROM
        information_schema.columns
    WHERE
        table_name = 'tags'
        AND table_schema = 'public'
    ORDER BY ordinal_position;

    -- Check foreign key constraints
    SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
    FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
    WHERE
        tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name='article_tags';

    -- Test insert (should work now)
    -- INSERT INTO public.tags (name, slug) VALUES ('test_tag', 'test-tag') ON CONFLICT (name) DO NOTHING;
    -- INSERT INTO public.article_tags (article_id, tag_id)
    -- SELECT a.id, t.id FROM public.articles a, public.tags t
    -- WHERE a.title LIKE '%test%' AND t.name = 'test_tag' LIMIT 1;


        JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
    WHERE
        tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name='article_tags';

    -- Test insert (should work now)
    -- INSERT INTO public.tags (name, slug) VALUES ('test_tag', 'test-tag') ON CONFLICT (name) DO NOTHING;
    -- INSERT INTO public.article_tags (article_id, tag_id)
    -- SELECT a.id, t.id FROM public.articles a, public.tags t
    -- WHERE a.title LIKE '%test%' AND t.name = 'test_tag' LIMIT 1;


        JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
    WHERE
        tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name='article_tags';

    -- Test insert (should work now)
    -- INSERT INTO public.tags (name, slug) VALUES ('test_tag', 'test-tag') ON CONFLICT (name) DO NOTHING;
    -- INSERT INTO public.article_tags (article_id, tag_id)
    -- SELECT a.id, t.id FROM public.articles a, public.tags t
    -- WHERE a.title LIKE '%test%' AND t.name = 'test_tag' LIMIT 1;


    -- Check article_tags table structure
    SELECT
        column_name,
        data_type,
        is_nullable
    FROM
        information_schema.columns
    WHERE
        table_name = 'article_tags'
        AND table_schema = 'public'
    ORDER BY ordinal_position;

    -- Check tags table structure
    SELECT
        column_name,
        data_type,
        is_nullable
    FROM
        information_schema.columns
    WHERE
        table_name = 'tags'
        AND table_schema = 'public'
    ORDER BY ordinal_position;

    -- Check foreign key constraints
    SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
    FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
    WHERE
        tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name='article_tags';

    -- Test insert (should work now)
    -- INSERT INTO public.tags (name, slug) VALUES ('test_tag', 'test-tag') ON CONFLICT (name) DO NOTHING;
    -- INSERT INTO public.article_tags (article_id, tag_id)
    -- SELECT a.id, t.id FROM public.articles a, public.tags t
    -- WHERE a.title LIKE '%test%' AND t.name = 'test_tag' LIMIT 1;


        JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
    WHERE
        tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name='article_tags';

    -- Test insert (should work now)
    -- INSERT INTO public.tags (name, slug) VALUES ('test_tag', 'test-tag') ON CONFLICT (name) DO NOTHING;
    -- INSERT INTO public.article_tags (article_id, tag_id)
    -- SELECT a.id, t.id FROM public.articles a, public.tags t
    -- WHERE a.title LIKE '%test%' AND t.name = 'test_tag' LIMIT 1;


        JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
    WHERE
        tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name='article_tags';

    -- Test insert (should work now)
    -- INSERT INTO public.tags (name, slug) VALUES ('test_tag', 'test-tag') ON CONFLICT (name) DO NOTHING;
    -- INSERT INTO public.article_tags (article_id, tag_id)
    -- SELECT a.id, t.id FROM public.articles a, public.tags t
    -- WHERE a.title LIKE '%test%' AND t.name = 'test_tag' LIMIT 1;


-- Check table structure
SELECT
    column_name,
    data_type,
    is_nullable
FROM
    information_schema.columns
WHERE
    table_name = 'article_tags'
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check foreign key constraints
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE
    tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name='article_tags';

-- Test insert (should work now)
-- INSERT INTO public.tags (name, slug) VALUES ('test_tag', 'test-tag') ON CONFLICT (name) DO NOTHING;
-- INSERT INTO public.article_tags (article_id, tag_id)
-- SELECT a.id, t.id FROM public.articles a, public.tags t
-- WHERE a.title LIKE '%test%' AND t.name = 'test_tag' LIMIT 1;
