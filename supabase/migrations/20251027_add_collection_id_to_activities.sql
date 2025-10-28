BEGIN;

-- Add collection_id column to activities table
ALTER TABLE activities
ADD COLUMN collection_id uuid REFERENCES collections(id) ON DELETE SET NULL;

-- (Optional) update existing rows if you want to backfill collection info later
-- For now, we'll leave them null

COMMIT;
