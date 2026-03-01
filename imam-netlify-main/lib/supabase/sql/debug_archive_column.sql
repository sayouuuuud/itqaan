-- Check if the column actually exists and its type
SELECT 
    column_name, 
    data_type 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'books' 
    AND column_name = 'archive_url';

-- Check RLS policies to ensure update is allowed
SELECT * FROM pg_policies WHERE tablename = 'books';
