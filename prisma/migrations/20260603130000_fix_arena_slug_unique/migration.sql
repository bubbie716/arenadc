-- Arena slug was globally unique; drop leftover constraint for per-server slugs
ALTER TABLE "Arena" DROP CONSTRAINT IF EXISTS "Arena_slug_key";
DROP INDEX IF EXISTS "Arena_slug_key";
