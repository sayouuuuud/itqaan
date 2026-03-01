SELECT id, title, pdf_file_path 
FROM books 
WHERE pdf_file_path NOT ILIKE '%cloudinary%' 
AND archive_url IS NULL;
