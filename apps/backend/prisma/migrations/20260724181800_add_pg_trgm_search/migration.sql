-- Create pg_trgm extension if it doesn't exist (Requires superuser privileges)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN index for faster text search on Product name
CREATE INDEX IF NOT EXISTS product_name_trgm_idx ON "Product" USING GIN (name gin_trgm_ops);

-- Create GIN index for faster text search on Product description
CREATE INDEX IF NOT EXISTS product_desc_trgm_idx ON "Product" USING GIN (description gin_trgm_ops);
