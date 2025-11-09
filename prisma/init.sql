-- Initialize database with default settings
INSERT INTO settings (key, value) VALUES
('site_name', 'Personal Blog'),
('site_description', 'A modern personal blog built with Next.js'),
('site_author', 'Your Name'),
('site_url', 'http://localhost:3000'),
('contact_email', 'contact@example.com'),
('posts_per_page', '10'),
('enable_comments', 'true'),
('enable_subscriptions', 'true');

-- Create default categories
INSERT INTO categories (name, slug, description, color) VALUES
('Technology', 'technology', 'Posts about technology and programming', '#3b82f6'),
('Lifestyle', 'lifestyle', 'Posts about lifestyle and personal thoughts', '#10b981'),
('Travel', 'travel', 'Travel experiences and stories', '#f59e0b'),
('Tutorial', 'tutorial', 'Step-by-step guides and tutorials', '#8b5cf6'),
('Opinion', 'opinion', 'Personal opinions and thoughts', '#ef4444');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_published_created_at ON posts(published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_view_count ON posts(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_views_post_created ON views(post_id, created_at DESC);