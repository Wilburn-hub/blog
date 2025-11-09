--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Homebrew)
-- Dumped by pg_dump version 14.18 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."NotificationType" AS ENUM (
    'COMMENT',
    'REPLY',
    'LIKE',
    'FOLLOW',
    'SYSTEM'
);


ALTER TYPE public."NotificationType" OWNER TO postgres;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRole" AS ENUM (
    'USER',
    'ADMIN'
);


ALTER TYPE public."UserRole" OWNER TO postgres;

--
-- Name: cleanup_old_refresh_tokens(); Type: FUNCTION; Schema: public; Owner: liuweijia
--

CREATE FUNCTION public.cleanup_old_refresh_tokens() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM refresh_tokens
    WHERE expiresAt < CURRENT_TIMESTAMP;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$;


ALTER FUNCTION public.cleanup_old_refresh_tokens() OWNER TO liuweijia;

--
-- Name: cleanup_old_sessions(); Type: FUNCTION; Schema: public; Owner: liuweijia
--

CREATE FUNCTION public.cleanup_old_sessions() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM sessions
    WHERE expiresAt < CURRENT_TIMESTAMP;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$;


ALTER FUNCTION public.cleanup_old_sessions() OWNER TO liuweijia;

--
-- Name: update_post_view_count(uuid); Type: FUNCTION; Schema: public; Owner: liuweijia
--

CREATE FUNCTION public.update_post_view_count(post_uuid uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE posts
    SET viewCount = viewCount + 1
    WHERE id = post_uuid;
END;
$$;


ALTER FUNCTION public.update_post_view_count(post_uuid uuid) OWNER TO liuweijia;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: liuweijia
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updatedAt = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO liuweijia;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _CategoryToPost; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."_CategoryToPost" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_CategoryToPost" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    color text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comments (
    id text NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "authorId" text NOT NULL,
    "postId" text NOT NULL,
    "parentId" text
);


ALTER TABLE public.comments OWNER TO postgres;

--
-- Name: file_uploads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.file_uploads (
    id text NOT NULL,
    "originalName" text NOT NULL,
    filename text NOT NULL,
    mimetype text NOT NULL,
    size integer NOT NULL,
    path text NOT NULL,
    url text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.file_uploads OWNER TO postgres;

--
-- Name: likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.likes (
    id text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "userId" text NOT NULL,
    "postId" text NOT NULL
);


ALTER TABLE public.likes OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    type public."NotificationType" NOT NULL,
    read boolean DEFAULT false NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.posts (
    id text NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    excerpt text,
    content text NOT NULL,
    "coverImage" text,
    published boolean DEFAULT false NOT NULL,
    featured boolean DEFAULT false NOT NULL,
    tags text[],
    "readingTime" integer,
    "viewCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "authorId" text NOT NULL
);


ALTER TABLE public.posts OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    name text,
    username text NOT NULL,
    avatar text,
    bio text,
    website text,
    location text,
    password text NOT NULL,
    role public."UserRole" DEFAULT 'USER'::public."UserRole" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "emailVerified" timestamp(3) without time zone,
    "lastLoginAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: published_posts_with_author; Type: VIEW; Schema: public; Owner: liuweijia
--

CREATE VIEW public.published_posts_with_author AS
 SELECT p.id,
    p.title,
    p.slug,
    p.excerpt,
    p."coverImage",
    p.featured,
    p.tags,
    p."readingTime",
    p."viewCount",
    p."publishedAt",
    p."createdAt",
    u.name AS author_name,
    u.username AS author_username,
    u.avatar AS author_avatar
   FROM (public.posts p
     JOIN public.users u ON ((p."authorId" = u.id)))
  WHERE (p.published = true)
  ORDER BY p."publishedAt" DESC;


ALTER TABLE public.published_posts_with_author OWNER TO liuweijia;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens (
    id text NOT NULL,
    token text NOT NULL,
    "userId" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.refresh_tokens OWNER TO postgres;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settings (
    id text NOT NULL,
    key text NOT NULL,
    value text NOT NULL
);


ALTER TABLE public.settings OWNER TO postgres;

--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscriptions (
    id text NOT NULL,
    email text NOT NULL,
    name text,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.subscriptions OWNER TO postgres;

--
-- Name: views; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.views (
    id text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "postId" text NOT NULL,
    ip text,
    "userAgent" text
);


ALTER TABLE public.views OWNER TO postgres;

--
-- Data for Name: _CategoryToPost; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."_CategoryToPost" ("A", "B") FROM stdin;
cmhruxu9s0001nu896p1xc32i	cmhruxu9y0007nu89zgrzmnze
cmhruxu9w0004nu89l83vsmu1	cmhruxu9y0007nu89zgrzmnze
cmhruxu9s0001nu896p1xc32i	cmhruxua30009nu896lg5kv2a
cmhruxu9w0004nu89l83vsmu1	cmhruxua30009nu896lg5kv2a
cmhruxu9s0001nu896p1xc32i	cmhruxua5000bnu89b9k45zhg
cmhruxu9w0004nu89l83vsmu1	cmhruxua5000bnu89b9k45zhg
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
de1a90f0-b6c9-4727-8a67-bab725d0866a	bfa1eeaac9da302e165e68e639720d992b4bf3f8e375a95c960c704fd73bee52	2025-11-09 23:17:30.916998+08	20251109151730_init	\N	\N	2025-11-09 23:17:30.889262+08	1
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, slug, description, color, "createdAt", "updatedAt") FROM stdin;
cmhruxu9s0001nu896p1xc32i	Technology	technology	Posts about technology and programming	#3b82f6	2025-11-09 15:17:43.936	2025-11-09 15:17:43.936
cmhruxu9v0002nu891afervhn	Lifestyle	lifestyle	Posts about lifestyle and personal thoughts	#10b981	2025-11-09 15:17:43.939	2025-11-09 15:17:43.939
cmhruxu9v0003nu89nnb9nykk	Travel	travel	Travel experiences and stories	#f59e0b	2025-11-09 15:17:43.94	2025-11-09 15:17:43.94
cmhruxu9w0004nu89l83vsmu1	Tutorial	tutorial	Step-by-step guides and tutorials	#8b5cf6	2025-11-09 15:17:43.941	2025-11-09 15:17:43.941
cmhruxu9x0005nu896xb08sxz	Opinion	opinion	Personal opinions and thoughts	#ef4444	2025-11-09 15:17:43.941	2025-11-09 15:17:43.941
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comments (id, content, "createdAt", "updatedAt", "authorId", "postId", "parentId") FROM stdin;
cmhruy44v0003iowbc4kox3nq	Great post! I really enjoyed reading about your development workflow.	2025-11-09 15:17:56.72	2025-11-09 15:17:56.72	cmhruy44g0000iowb8xsjafbz	cmhruxu9y0007nu89zgrzmnze	\N
cmhruy44y0005iowb9hlhadt3	This is exactly what I was looking for! Thanks for sharing.	2025-11-09 15:17:56.722	2025-11-09 15:17:56.722	cmhruy44t0001iowbvdgmvh1k	cmhruxu9y0007nu89zgrzmnze	\N
cmhruy44y0007iowbf4ixz65t	The Next.js tutorial was very helpful. Do you have any tips for optimizing performance?	2025-11-09 15:17:56.723	2025-11-09 15:17:56.723	cmhruy44g0000iowb8xsjafbz	cmhruxua30009nu896lg5kv2a	\N
cmhruy44z0009iowbelnswe6l	I've been using Next.js for a while and this approach works great!	2025-11-09 15:17:56.724	2025-11-09 15:17:56.724	cmhruy44t0001iowbvdgmvh1k	cmhruxua30009nu896lg5kv2a	\N
cmhruy457000piowbgo5ti7r4	For performance, I recommend using Next.js Image optimization and implementing proper caching strategies.	2025-11-09 15:17:56.732	2025-11-09 15:17:56.732	cmhruy44g0000iowb8xsjafbz	cmhruxua30009nu896lg5kv2a	cmhruy44z0009iowbelnswe6l
\.


--
-- Data for Name: file_uploads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.file_uploads (id, "originalName", filename, mimetype, size, path, url, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: likes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.likes (id, "createdAt", "userId", "postId") FROM stdin;
cmhruy450000biowbcn8nx0tx	2025-11-09 15:17:56.724	cmhruy44g0000iowb8xsjafbz	cmhruxu9y0007nu89zgrzmnze
cmhruy452000diowbzxleduf4	2025-11-09 15:17:56.726	cmhruy44t0001iowbvdgmvh1k	cmhruxu9y0007nu89zgrzmnze
cmhruy452000fiowb2w6aadfs	2025-11-09 15:17:56.727	cmhruy44g0000iowb8xsjafbz	cmhruxua30009nu896lg5kv2a
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, title, content, type, read, "userId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.posts (id, title, slug, excerpt, content, "coverImage", published, featured, tags, "readingTime", "viewCount", "createdAt", "updatedAt", "publishedAt", "authorId") FROM stdin;
cmhruxua5000bnu89b9k45zhg	My Development Workflow	my-development-workflow	A look at my current development workflow and the tools I use daily.	# My Development Workflow\n\nToday I want to share my current development workflow and the tools that help me stay productive.\n\n## Essential Tools\n\n### Code Editor\n- VS Code with extensions\n- Custom keybindings\n- Integrated terminal\n\n### Version Control\n- Git with GitHub\n- Conventional commits\n- Pull request workflow\n\n### Development Environment\n- Docker for containerization\n- Node.js for JavaScript/TypeScript\n- Database tools\n\n## Workflow Process\n\n1. **Planning**: Define requirements and architecture\n2. **Development**: Write code with TDD approach\n3. **Testing**: Unit tests and integration tests\n4. **Review**: Code review and refactoring\n5. **Deployment**: CI/CD pipeline\n\nThis workflow helps me maintain code quality and deliver features efficiently.	\N	f	f	{workflow,tools,productivity}	4	0	2025-11-09 15:17:43.949	2025-11-09 15:17:43.949	\N	cmhruxu9i0000nu891memkrkv
cmhruxu9y0007nu89zgrzmnze	Welcome to My Blog	welcome-to-my-blog	This is the first post on my personal blog. Welcome!	# Welcome to My Blog\n\nThis is the first post on my personal blog built with Next.js, TypeScript, and Tailwind CSS.\n\n## Features\n\n- Modern UI with Tailwind CSS\n- TypeScript for type safety\n- Prisma for database management\n- Authentication with NextAuth\n- Responsive design\n\n## Getting Started\n\nThis blog is designed to be fast, secure, and easy to maintain. It uses the latest web technologies to provide the best user experience.\n\nThank you for visiting!	\N	t	t	{welcome,intro,blog}	2	2	2025-11-09 15:17:43.942	2025-11-09 15:17:56.729	2025-11-09 15:17:43.942	cmhruxu9i0000nu891memkrkv
cmhruxua30009nu896lg5kv2a	Building a Modern Blog with Next.js	building-modern-blog-nextjs	Learn how to build a modern, fast, and SEO-friendly blog using Next.js 14.	# Building a Modern Blog with Next.js\n\nIn this post, I'll share my experience building this blog using Next.js 14 and other modern technologies.\n\n## Technology Stack\n\n### Frontend\n- Next.js 14 with App Router\n- TypeScript for type safety\n- Tailwind CSS for styling\n- Shadcn/ui components\n\n### Backend\n- Next.js API routes\n- Prisma ORM\n- PostgreSQL database\n- Redis for caching\n\n## Why Next.js?\n\nNext.js provides several advantages for a blog:\n\n1. **SSG/SSR**: Great for SEO and performance\n2. **Image Optimization**: Automatic image optimization\n3. **API Routes**: Backend functionality included\n4. **TypeScript**: Built-in support\n\n## Conclusion\n\nBuilding a blog with Next.js has been a great experience. The framework provides all the tools needed to create a fast, modern, and maintainable blog.	\N	t	t	{nextjs,tutorial,webdev}	5	2	2025-11-09 15:17:43.948	2025-11-09 15:17:56.73	2025-11-09 15:17:43.947	cmhruxu9i0000nu891memkrkv
cmhrv2tnj000nel98lqywjmhp		empty-title-post	\N	Content	\N	f	f	\N	\N	0	2025-11-09 15:21:36.415	2025-11-09 15:21:36.415	\N	cmhruxu9i0000nu891memkrkv
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refresh_tokens (id, token, "userId", "expiresAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, "sessionToken", "userId", "expiresAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings (id, key, value) FROM stdin;
cmhruxua7000cnu89i1j2e5k6	site_name	Personal Blog
cmhruxua8000dnu8923pz4b8p	site_description	A modern personal blog built with Next.js
cmhruxua8000enu89uvhoszug	site_author	Admin User
cmhruxua8000fnu8940rakch2	site_url	http://localhost:3000
cmhruxua9000gnu89js4yyong	contact_email	admin@example.com
cmhruxua9000hnu8966z4l7cq	posts_per_page	10
cmhruxua9000inu89tkt11aj2	enable_comments	true
cmhruxua9000jnu89zjayj2yc	enable_subscriptions	true
cmhrv2t4k000hel98m65nfuun	test_setting	initial_value
\.


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscriptions (id, email, name, active, "createdAt", "updatedAt") FROM stdin;
cmhruy458000qiowb1x1h5nx3	subscriber1@example.com	Alice	t	2025-11-09 15:17:56.733	2025-11-09 15:17:56.733
cmhruy458000riowbei0yk4ub	subscriber2@example.com	Bob	t	2025-11-09 15:17:56.733	2025-11-09 15:17:56.733
cmhruy458000siowbfry3rehc	subscriber3@example.com	Charlie	t	2025-11-09 15:17:56.733	2025-11-09 15:17:56.733
cmhrv2t4i000fel98ii1274tl	test-subscriber@example.com	Test Subscriber	t	2025-11-09 15:21:35.731	2025-11-09 15:21:35.731
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, name, username, avatar, bio, website, location, password, role, "isActive", "emailVerified", "lastLoginAt", "createdAt", "updatedAt") FROM stdin;
cmhruxu9i0000nu891memkrkv	admin@example.com	Admin User	admin	\N	Blog administrator	\N	\N	$2b$10$zwx19pnD5Op.jmf1XPWb2eI5XXtFWMT3Q/EIe4P4KMfLloxKNTEeG	ADMIN	t	\N	\N	2025-11-09 15:17:43.926	2025-11-09 15:17:43.926
cmhruy44g0000iowb8xsjafbz	john@example.com	John Doe	johndoe	\N	Tech enthusiast and blogger	\N	\N	$2b$10$JAqaqkyZtxMeVWSBxw2oTOdG/cg0nNyoIVQmunrC/38w0id.e.OHG	USER	t	\N	\N	2025-11-09 15:17:56.703	2025-11-09 15:17:56.703
cmhruy44t0001iowbvdgmvh1k	jane@example.com	Jane Smith	janesmith	\N	Web developer and designer	\N	\N	$2b$10$JAqaqkyZtxMeVWSBxw2oTOdG/cg0nNyoIVQmunrC/38w0id.e.OHG	USER	t	\N	\N	2025-11-09 15:17:56.717	2025-11-09 15:17:56.717
cmhrv2t3b0000el981vxna21z	test@example.com	Test User	testuser	\N	\N	\N	\N	hashedpassword	USER	t	\N	\N	2025-11-09 15:21:35.687	2025-11-09 15:21:35.687
\.


--
-- Data for Name: views; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.views (id, "createdAt", "postId", ip, "userAgent") FROM stdin;
cmhruy453000hiowbuf90ydb8	2025-11-09 15:17:56.727	cmhruxu9y0007nu89zgrzmnze	192.168.1.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)
cmhruy454000jiowbpaa3txhn	2025-11-09 15:17:56.728	cmhruxu9y0007nu89zgrzmnze	192.168.1.2	Mozilla/5.0 (Windows NT 10.0; Win64; x64)
cmhruy454000liowbv3ohyqzu	2025-11-09 15:17:56.728	cmhruxua30009nu896lg5kv2a	192.168.1.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)
cmhruy454000niowb537b1v7s	2025-11-09 15:17:56.729	cmhruxua30009nu896lg5kv2a	192.168.1.3	Mozilla/5.0 (X11; Linux x86_64)
cmhrv2t4g000del986du8urtr	2025-11-09 15:21:35.728	cmhruxu9y0007nu89zgrzmnze	192.168.1.1	Test Browser 1.0
cmhrv2t4g000eel98uog5h4j5	2025-11-09 15:21:35.728	cmhruxu9y0007nu89zgrzmnze	192.168.1.2	Test Browser 2.0
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: file_uploads file_uploads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.file_uploads
    ADD CONSTRAINT file_uploads_pkey PRIMARY KEY (id);


--
-- Name: likes likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: views views_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.views
    ADD CONSTRAINT views_pkey PRIMARY KEY (id);


--
-- Name: _CategoryToPost_AB_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "_CategoryToPost_AB_unique" ON public."_CategoryToPost" USING btree ("A", "B");


--
-- Name: _CategoryToPost_B_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "_CategoryToPost_B_index" ON public."_CategoryToPost" USING btree ("B");


--
-- Name: categories_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX categories_name_key ON public.categories USING btree (name);


--
-- Name: categories_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX categories_slug_key ON public.categories USING btree (slug);


--
-- Name: comments_authorId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "comments_authorId_idx" ON public.comments USING btree ("authorId");


--
-- Name: comments_postId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "comments_postId_idx" ON public.comments USING btree ("postId");


--
-- Name: file_uploads_filename_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX file_uploads_filename_key ON public.file_uploads USING btree (filename);


--
-- Name: idx_posts_content_gin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_posts_content_gin ON public.posts USING gin (content public.gin_trgm_ops);


--
-- Name: idx_posts_published_featured; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_posts_published_featured ON public.posts USING btree (published, featured) WHERE (published = true);


--
-- Name: idx_posts_title_gin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_posts_title_gin ON public.posts USING gin (title public.gin_trgm_ops);


--
-- Name: idx_subscriptions_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscriptions_active ON public.subscriptions USING btree (active) WHERE (active = true);


--
-- Name: likes_postId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "likes_postId_idx" ON public.likes USING btree ("postId");


--
-- Name: likes_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "likes_userId_idx" ON public.likes USING btree ("userId");


--
-- Name: likes_userId_postId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "likes_userId_postId_key" ON public.likes USING btree ("userId", "postId");


--
-- Name: posts_authorId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "posts_authorId_idx" ON public.posts USING btree ("authorId");


--
-- Name: posts_publishedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "posts_publishedAt_idx" ON public.posts USING btree ("publishedAt");


--
-- Name: posts_published_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX posts_published_idx ON public.posts USING btree (published);


--
-- Name: posts_slug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX posts_slug_idx ON public.posts USING btree (slug);


--
-- Name: posts_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX posts_slug_key ON public.posts USING btree (slug);


--
-- Name: refresh_tokens_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX refresh_tokens_token_key ON public.refresh_tokens USING btree (token);


--
-- Name: sessions_sessionToken_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "sessions_sessionToken_key" ON public.sessions USING btree ("sessionToken");


--
-- Name: settings_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX settings_key_key ON public.settings USING btree (key);


--
-- Name: subscriptions_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX subscriptions_email_key ON public.subscriptions USING btree (email);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: views_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "views_createdAt_idx" ON public.views USING btree ("createdAt");


--
-- Name: views_postId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "views_postId_idx" ON public.views USING btree ("postId");


--
-- Name: comments update_comments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: posts update_posts_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscriptions update_subscriptions_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: _CategoryToPost _CategoryToPost_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_CategoryToPost"
    ADD CONSTRAINT "_CategoryToPost_A_fkey" FOREIGN KEY ("A") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _CategoryToPost _CategoryToPost_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_CategoryToPost"
    ADD CONSTRAINT "_CategoryToPost_B_fkey" FOREIGN KEY ("B") REFERENCES public.posts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comments comments_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comments comments_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT "comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.comments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: comments comments_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT "comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES public.posts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: likes likes_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT "likes_postId_fkey" FOREIGN KEY ("postId") REFERENCES public.posts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: likes likes_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT "likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: posts posts_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT "posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sessions sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: views views_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.views
    ADD CONSTRAINT "views_postId_fkey" FOREIGN KEY ("postId") REFERENCES public.posts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

