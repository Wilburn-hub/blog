-- Database Optimization Script for Personal Blog
-- This script adds additional indexes and optimizations for better performance

-- Performance indexes for common queries
-- 1. Full-text search index for posts
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_posts_title_gin ON posts USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_posts_content_gin ON posts USING gin(content gin_trgm_ops);

-- 2. Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_posts_published_featured ON posts("published", "featured") WHERE "published" = true;
CREATE INDEX IF NOT EXISTS idx_posts_author_published ON posts("authorId", "published") WHERE "published" = true;
CREATE INDEX IF NOT EXISTS idx_posts_published_date ON posts("published", "publishedAt" DESC) WHERE "published" = true;

-- 3. User activity indexes
CREATE INDEX IF NOT EXISTS idx_comments_post_created ON comments("postId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_likes_post_created ON likes("postId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_views_post_created ON views("postId", "createdAt" DESC);

-- 4. Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications("userId", "read", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON notifications("userId", type, "createdAt" DESC);

-- 5. Session management indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_expires ON sessions("userId", "expiresAt");
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_expires ON refresh_tokens("userId", "expiresAt");

-- 6. Subscription management
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON subscriptions(active) WHERE active = true;

-- Database configuration optimizations
-- 1. Update statistics for better query planning
ANALYZE;

-- 2. Set recommended configurations (requires superuser privileges)
-- These would typically be set in postgresql.conf
-- shared_buffers = '256MB'
-- effective_cache_size = '1GB'
-- maintenance_work_mem = '64MB'
-- checkpoint_completion_target = 0.9
-- wal_buffers = '16MB'
-- default_statistics_target = 100

-- Create a function to update post view counts efficiently
CREATE OR REPLACE FUNCTION update_post_view_count(post_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE posts
    SET viewCount = viewCount + 1
    WHERE id = post_uuid;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to relevant tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a view for published posts with author information
CREATE OR REPLACE VIEW published_posts_with_author AS
SELECT
    p.id,
    p.title,
    p.slug,
    p.excerpt,
    p.coverImage,
    p.featured,
    p.tags,
    p.readingTime,
    p.viewCount,
    p.publishedAt,
    p.createdAt,
    u.name as author_name,
    u.username as author_username,
    u.avatar as author_avatar
FROM posts p
JOIN users u ON p."authorId" = u.id
WHERE p."published" = true
ORDER BY p.publishedAt DESC;

-- Create a function to clean up old sessions
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS integer AS $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM sessions
    WHERE expiresAt < CURRENT_TIMESTAMP;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to clean up old refresh tokens
CREATE OR REPLACE FUNCTION cleanup_old_refresh_tokens()
RETURNS integer AS $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM refresh_tokens
    WHERE expiresAt < CURRENT_TIMESTAMP;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions (adjust as needed)
-- GRANT USAGE ON SCHEMA public TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- Log optimization completion
DO $$
BEGIN
    RAISE NOTICE 'Database optimization completed successfully!';
    RAISE NOTICE 'Added full-text search indexes';
    RAISE NOTICE 'Added composite indexes for performance';
    RAISE NOTICE 'Created automated triggers for updated_at timestamps';
    RAISE NOTICE 'Created useful database views';
    RAISE NOTICE 'Created maintenance functions';
END $$;