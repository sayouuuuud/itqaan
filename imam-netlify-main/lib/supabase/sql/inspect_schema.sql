SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'books';

-- Also check content of one of the missing books to see if it has any other data
SELECT * FROM books WHERE id = '0b8fb0ae-57ce-4d28-809a-9f00237cb540';
