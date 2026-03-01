SELECT 
    CASE 
        WHEN pdf_file_path ILIKE '%cloudinary%' THEN 'Pending Migration'
        WHEN pdf_file_path NOT ILIKE '%cloudinary%' AND archive_url IS NOT NULL THEN 'Fully Migrated & Tracked'
        WHEN pdf_file_path NOT ILIKE '%cloudinary%' AND archive_url IS NULL THEN 'Migrated but No Archive History'
        ELSE 'Other'
    END as status,
    count(*) as count
FROM books
GROUP BY status;
