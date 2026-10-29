-- ==============================================================================
-- Signoret Pharmaceuticals Pvt. Ltd.
-- Complete Database Schema & Row Level Security (RLS) Policies
-- Verified Headquarters: Plot No. 556, Industrial Area Phase-9, Mohali, Punjab 160062
-- Verified Phone / WhatsApp: +91 81988 88864
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    composition TEXT,
    category TEXT NOT NULL DEFAULT 'Tablets', -- Tablets, Capsules, Syrups, Injections, etc.
    packing TEXT DEFAULT 'Standard Pack',
    description TEXT,
    image_url TEXT,
    hd_image_url TEXT,
    badge TEXT,
    form_type TEXT,
    slug TEXT UNIQUE,
    active BOOLEAN NOT NULL DEFAULT true,
    featured BOOLEAN NOT NULL DEFAULT false, -- For homepage featured formulations
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for public queries
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(active, sort_order);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);

-- 3. BLOG POSTS TABLE
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    category TEXT DEFAULT 'Industry Updates',
    body TEXT,
    description TEXT,
    image_url TEXT,
    published BOOLEAN NOT NULL DEFAULT false, -- Only published posts visible publicly
    date TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for public queries
CREATE INDEX IF NOT EXISTS idx_posts_published ON public.posts(published, created_at DESC);

-- 4. ENQUIRIES TABLE
CREATE TABLE IF NOT EXISTS public.enquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    product TEXT,
    message TEXT,
    source_page TEXT,
    status TEXT NOT NULL DEFAULT 'New', -- 'New', 'Contacted', 'In Progress', 'Completed'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for admin inquiries filter
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON public.enquiries(status, created_at DESC);

-- 5. SITE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY DEFAULT 'main',
    company_name TEXT NOT NULL DEFAULT 'Signoret Pharmaceuticals Pvt. Ltd.',
    address TEXT NOT NULL DEFAULT 'Plot No. 556, Industrial Area Phase-9, Mohali, Punjab 160062',
    phone TEXT NOT NULL DEFAULT '+91 81988 88864',
    whatsapp TEXT NOT NULL DEFAULT '918198888864',
    email TEXT,
    established_year TEXT DEFAULT '2019',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial default settings if empty
INSERT INTO public.settings (id, company_name, address, phone, whatsapp, established_year)
VALUES (
    'main',
    'Signoret Pharmaceuticals Pvt. Ltd.',
    'Plot No. 556, Industrial Area Phase-9, Mohali, Punjab 160062',
    '+91 81988 88864',
    '918198888864',
    '2019'
) ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- A. PRODUCTS POLICIES
-- (a) Anonymous / Public can SELECT only active products
-- (b) Authenticated admin can full CRUD
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products"
    ON public.products
    FOR SELECT
    TO anon, authenticated
    USING (active = true);

DROP POLICY IF EXISTS "Admin full access on products" ON public.products;
CREATE POLICY "Admin full access on products"
    ON public.products
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- B. BLOG POSTS POLICIES
-- (a) Anonymous / Public can SELECT only published posts
-- (b) Authenticated admin can full CRUD
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view published posts" ON public.posts;
CREATE POLICY "Public can view published posts"
    ON public.posts
    FOR SELECT
    TO anon, authenticated
    USING (published = true);

DROP POLICY IF EXISTS "Admin full access on posts" ON public.posts;
CREATE POLICY "Admin full access on posts"
    ON public.posts
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- C. ENQUIRIES POLICIES
-- (a) Anonymous / Public can INSERT enquiries (cannot SELECT, UPDATE, or DELETE)
-- (b) Authenticated admin can SELECT, UPDATE, and DELETE
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can insert enquiries" ON public.enquiries;
CREATE POLICY "Public can insert enquiries"
    ON public.enquiries
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        length(name) > 0 AND length(name) <= 120 AND
        length(phone) >= 10 AND length(phone) <= 25
    );

DROP POLICY IF EXISTS "Admin full access on enquiries" ON public.enquiries;
CREATE POLICY "Admin full access on enquiries"
    ON public.enquiries
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- D. SETTINGS POLICIES
-- (a) Anonymous / Public can SELECT settings
-- (b) Authenticated admin can update/insert
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view settings" ON public.settings;
CREATE POLICY "Public can view settings"
    ON public.settings
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Admin full access on settings" ON public.settings;
CREATE POLICY "Admin full access on settings"
    ON public.settings
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ==============================================================================
-- STORAGE BUCKETS AND STORAGE POLICIES
-- ==============================================================================
-- Run these in Supabase SQL Editor if storage buckets are not yet created:

INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('blog', 'blog', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS: Public can download/view
CREATE POLICY "Public can view product images"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'products');

CREATE POLICY "Public can view blog images"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'blog');

-- Storage RLS: Only authenticated admin can upload/update/delete
CREATE POLICY "Admin can upload product images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'products');

CREATE POLICY "Admin can update product images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'products');

CREATE POLICY "Admin can delete product images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'products');

CREATE POLICY "Admin can upload blog images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'blog');

CREATE POLICY "Admin can update blog images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'blog');

CREATE POLICY "Admin can delete blog images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'blog');
