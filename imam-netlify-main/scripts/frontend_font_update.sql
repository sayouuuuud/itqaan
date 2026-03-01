-- =====================================================
-- Frontend Font Family Update Query
-- =====================================================
-- This query should be used in the frontend when saving content
-- to ensure font_family is always saved with the content

-- For Articles:
UPDATE articles 
SET content = $1, 
    font_family = $2,
    updated_at = NOW()
WHERE id = $3;

-- For Khutba:
UPDATE khutba 
SET content = $1, 
    font_family = $2,
    updated_at = NOW()
WHERE id = $3;

-- For Dars:
UPDATE dars 
SET content = $1, 
    font_family = $2,
    updated_at = NOW()
WHERE id = $3;

-- For Books:
UPDATE books 
SET content = $1, 
    font_family = $2,
    updated_at = NOW()
WHERE id = $3;

-- =====================================================
-- Alternative: Insert with font_family
-- =====================================================

-- For new Articles:
INSERT INTO articles (title, content, font_family, created_at, updated_at)
VALUES ($1, $2, $3, NOW(), NOW());

-- For new Khutba:
INSERT INTO khutba (title, content, font_family, created_at, updated_at)
VALUES ($1, $2, $3, NOW(), NOW());

-- For new Dars:
INSERT INTO dars (title, content, font_family, created_at, updated_at)
VALUES ($1, $2, $3, NOW(), NOW());

-- For new Books:
INSERT INTO books (title, content, font_family, created_at, updated_at)
VALUES ($1, $2, $3, NOW(), NOW());

-- =====================================================
-- Select with font_family
-- =====================================================

-- Get Articles with font_family
SELECT id, title, content, font_family, created_at, updated_at 
FROM articles 
ORDER BY created_at DESC;

-- Get Khutba with font_family
SELECT id, title, content, font_family, created_at, updated_at 
FROM khutba 
ORDER BY created_at DESC;

-- Get Dars with font_family
SELECT id, title, content, font_family, created_at, updated_at 
FROM dars 
ORDER BY created_at DESC;

-- Get Books with font_family
SELECT id, title, content, font_family, created_at, updated_at 
FROM books 
ORDER BY created_at DESC;
