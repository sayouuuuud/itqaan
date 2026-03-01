CREATE TABLE IF NOT EXISTS public.about_page (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    sheikh_name text NOT NULL,
    sheikh_photo text,
    biography text NOT NULL,
    achievements text,
    education text,
    current_positions text,
    contact_info jsonb DEFAULT '{}'::jsonb,
    social_media jsonb DEFAULT '{}'::jsonb,
    stats jsonb DEFAULT '{}'::jsonb,
    tags text[],
    updated_at timestamp with time zone DEFAULT now(),
    image_path text,
    content text,
    positions text,
    quote text,
    quote_author text,
    social_links jsonb DEFAULT '[]'::jsonb,
    bio text
);

CREATE TABLE IF NOT EXISTS public.admin_profile (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text DEFAULT 'Ø§Ù„Ù…Ø¯ÙŠØ±'::text,
    email text,
    phone text,
    bio text,
    avatar text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.analytics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    page_path character varying(255),
    content_type character varying(50),
    content_id uuid,
    visitor_id character varying(255),
    views_count integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now(),
    date date DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS public.appearance_settings (
    id uuid DEFAULT 'a0000000-0000-0000-0000-000000000001'::uuid NOT NULL,
    primary_color character varying(20) DEFAULT '#1e4338'::character varying,
    secondary_color character varying(20) DEFAULT '#d4af37'::character varying,
    dark_mode_enabled boolean DEFAULT true,
    show_hijri_date boolean DEFAULT true,
    site_logo_path text DEFAULT ''::text,
    site_logo_path_dark text DEFAULT ''::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.articles (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    title text NOT NULL,
    slug text,
    excerpt text,
    content text NOT NULL,
    thumbnail text,
    category_id uuid,
    author text DEFAULT 'Ø§Ù„Ø´ÙŠØ® Ø§Ù„Ø³ÙŠØ¯ Ù…Ø±Ø§Ø¯'::text,
    read_time integer DEFAULT 5,
    publish_status text DEFAULT 'draft'::text,
    views integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    featured_image text,
    views_count integer DEFAULT 0,
    CONSTRAINT articles_publish_status_check CHECK ((publish_status = ANY (ARRAY['draft'::text, 'published'::text])))
);

CREATE TABLE IF NOT EXISTS public.books (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    title text NOT NULL,
    description text,
    cover_image text,
    file_url text,
    file_size text,
    pages integer,
    category_id uuid,
    publish_year text,
    isbn text,
    publish_status text DEFAULT 'draft'::text,
    downloads integer DEFAULT 0,
    views integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    pdf_file_path text,
    cover_image_path text,
    download_count integer DEFAULT 0,
    author text DEFAULT 'Ø§Ù„Ø´ÙŠØ® Ø§Ù„Ø³ÙŠØ¯ Ù…Ø±Ø§Ø¯'::text,
    CONSTRAINT books_publish_status_check CHECK ((publish_status = ANY (ARRAY['draft'::text, 'published'::text])))
);

CREATE TABLE IF NOT EXISTS public.categories (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    type text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT categories_type_check CHECK ((type = ANY (ARRAY['sermon'::text, 'lesson'::text, 'article'::text, 'book'::text, 'media'::text])))
);

CREATE TABLE IF NOT EXISTS public.comments (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    content_type text NOT NULL,
    content_id uuid NOT NULL,
    author_name text NOT NULL,
    author_email text,
    comment_text text NOT NULL,
    is_approved boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT comments_content_type_check CHECK ((content_type = ANY (ARRAY['sermon'::text, 'lesson'::text, 'article'::text, 'book'::text, 'media'::text])))
);

CREATE TABLE IF NOT EXISTS public.community_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid,
    author_name text NOT NULL,
    author_email text,
    content text NOT NULL,
    is_approved boolean DEFAULT false,
    is_sheikh_reply boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_pages (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    images jsonb DEFAULT '[]'::jsonb,
    publish_status text DEFAULT 'draft'::text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT community_pages_publish_status_check CHECK ((publish_status = ANY (ARRAY['draft'::text, 'published'::text])))
);

CREATE TABLE IF NOT EXISTS public.community_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    author_name text NOT NULL,
    author_email text,
    title text NOT NULL,
    content text NOT NULL,
    post_type text DEFAULT 'question'::text,
    is_approved boolean DEFAULT false,
    is_featured boolean DEFAULT false,
    views_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contact_fields (
    id text NOT NULL,
    name text NOT NULL,
    label text NOT NULL,
    is_required boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contact_form_settings (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    fields jsonb DEFAULT '[{"name": "name", "type": "text", "label": "Ø§Ù„Ø§Ø³Ù…", "required": true}, {"name": "email", "type": "email", "label": "Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ", "required": true}, {"name": "subject", "type": "select", "label": "Ø§Ù„Ù…ÙˆØ¶ÙˆØ¹", "required": true}, {"name": "message", "type": "textarea", "label": "Ø§Ù„Ø±Ø³Ø§Ù„Ø©", "required": true}]'::jsonb,
    subject_options jsonb DEFAULT '["Ø§Ø³ØªÙØ³Ø§Ø± Ø¹Ø§Ù…", "Ø·Ù„Ø¨ ÙØªÙˆÙ‰", "Ø§Ù‚ØªØ±Ø§Ø­", "Ø´ÙƒÙˆÙ‰", "Ø£Ø®Ø±Ù‰"]'::jsonb,
    important_notice text DEFAULT 'ÙŠØ±Ø¬Ù‰ Ø§Ù„ØªØ£ÙƒØ¯ Ù…Ù† ØµØ­Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ù‚Ø¨Ù„ Ø§Ù„Ø¥Ø±Ø³Ø§Ù„'::text,
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contact_messages (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    subject text,
    message text NOT NULL,
    phone text,
    is_read boolean DEFAULT false,
    is_favorite boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contact_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    important_notice text DEFAULT 'Ù‡Ø°Ø§ Ø§Ù„Ù†Ù…ÙˆØ°Ø¬ Ù…Ø®ØµØµ Ù„Ù„ØªÙˆØ§ØµÙ„ Ø§Ù„Ø¹Ø§Ù… ÙˆØ§Ù„Ø§Ù‚ØªØ±Ø§Ø­Ø§Øª Ø§Ù„ØªÙ‚Ù†ÙŠØ©. Ù„Ø§ ÙŠÙ‚Ø¯Ù… Ø§Ù„Ù…ÙˆÙ‚Ø¹ ÙØªØ§ÙˆÙ‰ Ø´Ø±Ø¹ÙŠØ© ÙˆÙ„Ø§ ÙŠØªÙ… Ø§Ù„Ø±Ø¯ Ø¹Ù„Ù‰ Ø§Ù„Ø£Ø³Ø¦Ù„Ø© Ø§Ù„ÙÙ‚Ù‡ÙŠØ© Ø¹Ø¨Ø± Ù‡Ø°Ø§ Ø§Ù„Ù†Ù…ÙˆØ°Ø¬.'::text,
    email character varying(255) DEFAULT 'contact@alsayedmourad.com'::character varying,
    phone character varying(255),
    whatsapp_number character varying(255),
    address text,
    facebook_url character varying(255) DEFAULT '#'::character varying,
    youtube_url character varying(255) DEFAULT '#'::character varying,
    telegram_url character varying(255) DEFAULT '#'::character varying,
    notice_enabled boolean DEFAULT true,
    subject_options jsonb DEFAULT '["Ø§Ø³ØªÙØ³Ø§Ø± Ø¹Ø§Ù…", "Ø·Ù„Ø¨ ÙØªÙˆÙ‰", "Ø§Ù‚ØªØ±Ø§Ø­", "Ø´ÙƒÙˆÙ‰", "Ø£Ø®Ø±Ù‰"]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contact_submissions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    form_data jsonb NOT NULL,
    is_read boolean DEFAULT false,
    submitted_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dawah_projects (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    images jsonb DEFAULT '[]'::jsonb,
    publish_status text DEFAULT 'draft'::text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dawah_projects_publish_status_check CHECK ((publish_status = ANY (ARRAY['draft'::text, 'published'::text])))
);

CREATE TABLE IF NOT EXISTS public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    event_type text DEFAULT 'general'::text NOT NULL,
    type text DEFAULT 'weekly'::text NOT NULL,
    day_of_week text,
    event_date date,
    event_time time without time zone,
    location text,
    is_live boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    time_text text,
    order_index integer DEFAULT 0,
    CONSTRAINT events_type_check CHECK ((type = ANY (ARRAY['weekly'::text, 'one_time'::text])))
);

CREATE TABLE IF NOT EXISTS public.hero_section (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    hadith_text text NOT NULL,
    hadith_source text NOT NULL,
    button_text text,
    button_link text,
    featured_book_id uuid,
    background_image text,
    is_active boolean DEFAULT true,
    updated_at timestamp with time zone DEFAULT now(),
    pop_button_link text,
    pop_button_text text,
    announcement_text text,
    announcement_enabled boolean DEFAULT false,
    hadith_arabic text,
    hadith_translation text,
    hadith_explanation text,
    hadith_button_text text DEFAULT 'اقرأ المزيد'::text,
    hadith_button_link text DEFAULT '/articles'::text,
    book_custom_text text DEFAULT 'أحدث إصدارات الشيخ'::text,
    book_button_text text DEFAULT 'تصفح الكتب'::text,
    book_button_link text DEFAULT '/books'::text,
    important_notice text,
    important_notice_link text,
    show_important_notice boolean DEFAULT false,
    underline_text text
);

CREATE TABLE IF NOT EXISTS public.hero_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text DEFAULT 'Ø§Ù„Ø´ÙŠØ® Ø§Ù„Ø³ÙŠØ¯ Ù…Ø±Ø§Ø¯'::text,
    subtitle text DEFAULT 'Ø¯Ø§Ø¹ÙŠØ© Ø¥Ø³Ù„Ø§Ù…ÙŠ ÙˆØ¹Ø§Ù„Ù… Ø´Ø±Ø¹ÙŠ'::text,
    description text,
    background_image text,
    show_subscribe_button boolean DEFAULT true,
    show_schedule_button boolean DEFAULT true,
    subscribe_button_text text DEFAULT 'Ø§Ø´ØªØ±Ùƒ Ø§Ù„Ø¢Ù†'::text,
    schedule_button_text text DEFAULT 'Ø¬Ø¯ÙˆÙ„ Ø§Ù„Ø¯Ø±ÙˆØ³'::text,
    notice_text text,
    notice_active boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    underline_text character varying(255),
    featured_book_id uuid
);

CREATE TABLE IF NOT EXISTS public.lesson_schedule (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    category text NOT NULL,
    title text NOT NULL,
    "time" text NOT NULL,
    location text NOT NULL,
    description text,
    enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lessons (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    title text NOT NULL,
    description text,
    content text,
    audio_url text,
    video_url text,
    thumbnail text,
    duration text,
    category_id uuid,
    series text,
    episode_number integer,
    publish_status text DEFAULT 'draft'::text,
    views integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    media_url text,
    media_source text DEFAULT 'youtube'::text,
    lesson_type text DEFAULT 'general'::text,
    type text DEFAULT 'video'::text,
    thumbnail_path text,
    views_count integer DEFAULT 0,
    series_id uuid,
    order_in_series integer DEFAULT 0,
    CONSTRAINT lessons_publish_status_check CHECK ((publish_status = ANY (ARRAY['draft'::text, 'published'::text])))
);

CREATE TABLE IF NOT EXISTS public.media (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    title text NOT NULL,
    description text,
    type text NOT NULL,
    url text NOT NULL,
    thumbnail text,
    duration text,
    category_id uuid,
    publish_status text DEFAULT 'draft'::text,
    views integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    source text DEFAULT 'youtube'::text,
    url_or_path text,
    is_active boolean DEFAULT true,
    views_count integer DEFAULT 0,
    CONSTRAINT media_publish_status_check CHECK ((publish_status = ANY (ARRAY['draft'::text, 'published'::text]))),
    CONSTRAINT media_type_check CHECK ((type = ANY (ARRAY['video'::text, 'audio'::text])))
);

CREATE TABLE IF NOT EXISTS public.navbar_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    label character varying(100) NOT NULL,
    href character varying(255) NOT NULL,
    order_index integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    type character varying(50) DEFAULT 'info'::character varying NOT NULL,
    is_read boolean DEFAULT false,
    source_id uuid,
    source_type character varying(50),
    link character varying(500),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT notifications_type_check CHECK (((type)::text = ANY ((ARRAY['info'::character varying, 'success'::character varying, 'warning'::character varying, 'error'::character varying, 'contact'::character varying, 'subscriber'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS public.privacy_policy (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    content text NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.schedule_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    event_type character varying(50) DEFAULT 'general'::character varying,
    event_date date NOT NULL,
    event_time time without time zone,
    location character varying(255),
    is_live boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.seo_settings (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    page_path text NOT NULL,
    page_title text NOT NULL,
    meta_description text,
    meta_keywords text,
    og_title text,
    og_description text,
    og_image text,
    twitter_title text,
    twitter_description text,
    twitter_image text,
    canonical_url text,
    robots text DEFAULT 'index, follow'::text,
    structured_data jsonb,
    updated_at timestamp with time zone DEFAULT now(),
    priority numeric(2,1) DEFAULT 0.5
);

CREATE TABLE IF NOT EXISTS public.sermons (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    title text NOT NULL,
    description text,
    content text,
    audio_url text,
    video_url text,
    thumbnail text,
    duration text,
    category_id uuid,
    publish_status text DEFAULT 'draft'::text,
    views integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    date date DEFAULT CURRENT_DATE,
    transcript text,
    views_count integer DEFAULT 0,
    thumbnail_path text,
    audio_file_path text,
    media_source text DEFAULT 'local'::text,
    youtube_url text,
    CONSTRAINT sermons_publish_status_check CHECK ((publish_status = ANY (ARRAY['draft'::text, 'published'::text])))
);

CREATE TABLE IF NOT EXISTS public.sheikh_profile (
    id uuid DEFAULT 'b0000000-0000-0000-0000-000000000001'::uuid NOT NULL,
    name character varying(255) DEFAULT 'Ø§Ù„Ø´ÙŠØ® Ø§Ù„Ø³ÙŠØ¯ Ù…Ø±Ø§Ø¯'::character varying,
    title character varying(255) DEFAULT 'Ø¹Ø§Ù„Ù… Ø£Ø²Ù‡Ø±ÙŠ ÙˆÙ…ÙÙƒØ± ØªØ±Ø¨ÙˆÙŠ'::character varying,
    bio text DEFAULT ''::text,
    photo_path text DEFAULT ''::text,
    education text DEFAULT ''::text,
    achievements text DEFAULT ''::text,
    current_positions text DEFAULT ''::text,
    tags jsonb DEFAULT '[]'::jsonb,
    social_media jsonb DEFAULT '{}'::jsonb,
    stats jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.site_analytics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    date date NOT NULL,
    views_count integer DEFAULT 0,
    unique_visitors integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.site_settings (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    key text NOT NULL,
    value text,
    type text DEFAULT 'text'::text,
    updated_at timestamp with time zone DEFAULT now(),
    footer_text text,
    footer_description text,
    copyright_text text
);

CREATE TABLE IF NOT EXISTS public.social_links (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    platform text NOT NULL,
    url text NOT NULL,
    icon text,
    is_active boolean DEFAULT true,
    order_index integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscribers (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    email text,
    name text,
    is_active boolean DEFAULT true,
    subscribed_at timestamp with time zone DEFAULT now(),
    active boolean DEFAULT true,
    telegram_username text,
    whatsapp_number text
);

CREATE TABLE IF NOT EXISTS public.tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    description text,
    color character varying(20) DEFAULT '#1e4338'::character varying,
    usage_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.terms_conditions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    content text NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.weekly_schedule (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    day_name text NOT NULL,
    "time" text NOT NULL,
    title text NOT NULL,
    location text,
    description text,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

INSERT INTO public.about_page ("id", "sheikh_name", "sheikh_photo", "biography", "achievements", "education", "current_positions", "contact_info", "social_media", "stats", "tags", "updated_at", "image_path", "content", "positions", "quote", "quote_author", "social_links", "bio")
VALUES ('bbdd32ae-b2b7-4010-bc77-faf304bb1340', 'Ø§Ù„Ø´ÙŠØ® Ø§Ù„Ø³ÙŠØ¯ Ù…Ø±Ø§Ø¯', '/placeholder.svg?height=400&width=400', 'Ø§Ù„Ø´ÙŠØ® Ø§Ù„Ø³ÙŠØ¯ Ù…Ø±Ø§Ø¯ Ù…Ù† Ø¹Ù„Ù…Ø§Ø¡ Ø§Ù„Ø£Ø²Ù‡Ø± Ø§Ù„Ø´Ø±ÙŠÙØŒ Ø­Ø§ØµÙ„ Ø¹Ù„Ù‰ Ø¯Ø±Ø¬Ø© Ø§Ù„Ø¯ÙƒØªÙˆØ±Ø§Ù‡ ÙÙŠ Ø§Ù„ÙÙ‚Ù‡ Ø§Ù„Ø¥Ø³Ù„Ø§Ù…ÙŠ. Ù„Ù‡ Ø§Ù„Ø¹Ø¯ÙŠØ¯ Ù…Ù† Ø§Ù„Ù…Ø¤Ù„ÙØ§Øª ÙˆØ§Ù„Ø¯Ø±ÙˆØ³ Ø§Ù„Ø¹Ù„Ù…ÙŠØ© ÙÙŠ Ù…Ø®ØªÙ„Ù Ø§Ù„Ø¹Ù„ÙˆÙ… Ø§Ù„Ø´Ø±Ø¹ÙŠØ©. ÙŠØ³Ø¹Ù‰ Ù…Ù† Ø®Ù„Ø§Ù„ Ù‡Ø°Ø§ Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø¥Ù„Ù‰ Ù†Ø´Ø± Ø§Ù„Ø¹Ù„Ù… Ø§Ù„Ø´Ø±Ø¹ÙŠ Ø§Ù„ØµØ­ÙŠØ­ ÙˆØªÙŠØ³ÙŠØ±Ù‡ Ù„Ù„Ù†Ø§Ø³.Ø¨Ø¯Ø£ Ù…Ø³ÙŠØ±ØªÙ‡ Ø§Ù„Ø¹Ù„Ù…ÙŠØ© ÙÙŠ Ø³Ù† Ù…Ø¨ÙƒØ±Ø© Ø­ÙŠØ« Ø­ÙØ¸ Ø§Ù„Ù‚Ø±Ø¢Ù† Ø§Ù„ÙƒØ±ÙŠÙ… ÙˆÙ‡Ùˆ ÙÙŠ Ø§Ù„Ø¹Ø§Ø´Ø±Ø© Ù…Ù† Ø¹Ù…Ø±Ù‡ØŒ Ø«Ù… Ø§Ù„ØªØ­Ù‚ Ø¨Ø§Ù„Ø£Ø²Ù‡Ø± Ø§Ù„Ø´Ø±ÙŠÙ Ù„ÙŠØªØ¯Ø±Ø¬ ÙÙŠ Ù…Ø±Ø§Ø­Ù„ Ø§Ù„ØªØ¹Ù„ÙŠÙ… Ø­ØªÙ‰ Ø­ØµÙ„ Ø¹Ù„Ù‰ Ø£Ø¹Ù„Ù‰ Ø§Ù„Ø¯Ø±Ø¬Ø§Øª Ø§Ù„Ø¹Ù„Ù…ÙŠØ©.', '- Ø­Ø§ØµÙ„ Ø¹Ù„Ù‰ Ø¬Ø§Ø¦Ø²Ø© Ø§Ù„Ø¯ÙˆÙ„Ø© Ø§Ù„ØªÙ‚Ø¯ÙŠØ±ÙŠØ© ÙÙŠ Ø§Ù„Ø¹Ù„ÙˆÙ… Ø§Ù„Ø¥Ø³Ù„Ø§Ù…ÙŠØ©- Ø£Ù„Ù‘Ù Ø£ÙƒØ«Ø± Ù…Ù† 20 ÙƒØªØ§Ø¨Ø§Ù‹ ÙÙŠ Ø§Ù„ÙÙ‚Ù‡ ÙˆØ§Ù„Ø¹Ù‚ÙŠØ¯Ø©- Ø£Ø´Ø±Ù Ø¹Ù„Ù‰ Ø§Ù„Ø¹Ø¯ÙŠØ¯ Ù…Ù† Ø±Ø³Ø§Ø¦Ù„ Ø§Ù„Ù…Ø§Ø¬Ø³ØªÙŠØ± ÙˆØ§Ù„Ø¯ÙƒØªÙˆØ±Ø§Ù‡- Ø´Ø§Ø±Ùƒ ÙÙŠ Ø§Ù„Ø¹Ø¯ÙŠØ¯ Ù…Ù† Ø§Ù„Ù…Ø¤ØªÙ…Ø±Ø§Øª Ø§Ù„Ø¯ÙˆÙ„ÙŠØ©', '- Ø¯ÙƒØªÙˆØ±Ø§Ù‡ ÙÙŠ Ø§Ù„ÙÙ‚Ù‡ Ø§Ù„Ø¥Ø³Ù„Ø§Ù…ÙŠ - Ø¬Ø§Ù…Ø¹Ø© Ø§Ù„Ø£Ø²Ù‡Ø±- Ù…Ø§Ø¬Ø³ØªÙŠØ± ÙÙŠ Ø§Ù„Ø´Ø±ÙŠØ¹Ø© Ø§Ù„Ø¥Ø³Ù„Ø§Ù…ÙŠØ© - Ø¬Ø§Ù…Ø¹Ø© Ø§Ù„Ø£Ø²Ù‡Ø±- Ù„ÙŠØ³Ø§Ù†Ø³ ÙƒÙ„ÙŠØ© Ø§Ù„Ø´Ø±ÙŠØ¹Ø© ÙˆØ§Ù„Ù‚Ø§Ù†ÙˆÙ† - Ø¬Ø§Ù…Ø¹Ø© Ø§Ù„Ø£Ø²Ù‡Ø±- Ø¥Ø¬Ø§Ø²Ø© ÙÙŠ Ø§Ù„Ù‚Ø±Ø¢Ù† Ø§Ù„ÙƒØ±ÙŠÙ… Ø¨Ø§Ù„Ù‚Ø±Ø§Ø¡Ø§Øª Ø§Ù„Ø¹Ø´Ø±', '- Ø£Ø³ØªØ§Ø° Ø§Ù„ÙÙ‚Ù‡ Ø§Ù„Ù…Ù‚Ø§Ø±Ù† Ø¨ÙƒÙ„ÙŠØ© Ø§Ù„Ø´Ø±ÙŠØ¹Ø©- Ø®Ø·ÙŠØ¨ Ù…Ø³Ø¬Ø¯ Ø§Ù„Ø±Ø­Ù…Ù†- Ø¹Ø¶Ùˆ Ù„Ø¬Ù†Ø© Ø§Ù„ÙØªÙˆÙ‰ Ø¨Ø§Ù„Ø£Ø²Ù‡Ø± Ø§Ù„Ø´Ø±ÙŠÙ- Ù…Ø³ØªØ´Ø§Ø± Ø´Ø±Ø¹ÙŠ Ù„Ø¹Ø¯Ø© Ù…Ø¤Ø³Ø³Ø§Øª Ø¥Ø³Ù„Ø§Ù…ÙŠØ©', '{"email": "contact@sheikhsayedmurad.com", "phone": "+20123456789", "address": "Ø§Ù„Ù‚Ø§Ù‡Ø±Ø©ØŒ Ù…ØµØ±"}', '{"twitter": "https://twitter.com/sheikhsayedmurad", "youtube": "https://youtube.com/@sheikhsayedmurad", "facebook": "https://facebook.com/sheikhsayedmurad", "telegram": "https://t.me/sheikhsayedmurad"}', '{"books": "20+", "years": "25+", "lectures": "1000+", "students": "5000+"}', '{ÙÙ‚Ù‡,Ø¹Ù‚ÙŠØ¯Ø©,ØªÙØ³ÙŠØ±,Ø­Ø¯ÙŠØ«,"Ø£ØµÙˆÙ„ Ø§Ù„ÙÙ‚Ù‡"}', '2026-01-03 02:22:04.349758+00', NULL, NULL, NULL, NULL, NULL, '[]', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.articles ("id", "title", "slug", "excerpt", "content", "thumbnail", "category_id", "author", "read_time", "publish_status", "views", "created_at", "updated_at", "is_active", "featured_image", "views_count")
VALUES ('62ecd318-3ffe-408b-86f8-e05a380a5fa6', 'Ø£Ø­ÙƒØ§Ù… Ø§Ù„ØµÙŠØ§Ù… ÙÙŠ Ø±Ù…Ø¶Ø§Ù†', 'fasting-rules-ramadan', 'Ù…Ù‚Ø§Ù„ Ø´Ø§Ù…Ù„ Ø¹Ù† Ø£Ø­ÙƒØ§Ù… Ø§Ù„ØµÙŠØ§Ù… ÙÙŠ Ø´Ù‡Ø± Ø±Ù…Ø¶Ø§Ù† Ø§Ù„Ù…Ø¨Ø§Ø±Ùƒ', 'Ø§Ù„Ø­Ù…Ø¯ Ù„Ù„Ù‡ Ø±Ø¨ Ø§Ù„Ø¹Ø§Ù„Ù…ÙŠÙ†ØŒ ÙˆØ§Ù„ØµÙ„Ø§Ø© ÙˆØ§Ù„Ø³Ù„Ø§Ù… Ø¹Ù„Ù‰ Ø£Ø´Ø±Ù Ø§Ù„Ø£Ù†Ø¨ÙŠØ§Ø¡ ÙˆØ§Ù„Ù…Ø±Ø³Ù„ÙŠÙ†...Ø§Ù„ØµÙŠØ§Ù… Ø±ÙƒÙ† Ù…Ù† Ø£Ø±ÙƒØ§Ù† Ø§Ù„Ø¥Ø³Ù„Ø§Ù… Ø§Ù„Ø®Ù…Ø³Ø©ØŒ ÙØ±Ø¶Ù‡ Ø§Ù„Ù„Ù‡ ØªØ¹Ø§Ù„Ù‰ Ø¹Ù„Ù‰ Ø§Ù„Ù…Ø³Ù„Ù…ÙŠÙ† ÙÙŠ Ø§Ù„Ø³Ù†Ø© Ø§Ù„Ø«Ø§Ù†ÙŠØ© Ù…Ù† Ø§Ù„Ù‡Ø¬Ø±Ø©...## Ø´Ø±ÙˆØ· ÙˆØ¬ÙˆØ¨ Ø§Ù„ØµÙŠØ§Ù…1. Ø§Ù„Ø¥Ø³Ù„Ø§Ù…2. Ø§Ù„Ø¨Ù„ÙˆØº3. Ø§Ù„Ø¹Ù‚Ù„4. Ø§Ù„Ù‚Ø¯Ø±Ø© Ø¹Ù„Ù‰ Ø§Ù„ØµÙŠØ§Ù…## Ø£Ø±ÙƒØ§Ù† Ø§Ù„ØµÙŠØ§Ù…1. Ø§Ù„Ù†ÙŠØ©2. Ø§Ù„Ø¥Ù…Ø³Ø§Ùƒ Ø¹Ù† Ø§Ù„Ù…ÙØ·Ø±Ø§Øª Ù…Ù† Ø·Ù„ÙˆØ¹ Ø§Ù„ÙØ¬Ø± Ø¥Ù„Ù‰ ØºØ±ÙˆØ¨ Ø§Ù„Ø´Ù…Ø³...', '/placeholder.svg', 'd88cb77d-03be-4862-a0c2-53b2dba45258', 'Ø§Ù„Ø´ÙŠØ® Ø§Ù„Ø³ÙŠØ¯ Ù…Ø±Ø§Ø¯', '8', 'published', '350', '2026-01-03 02:22:04.349758+00', '2026-01-03 02:22:04.349758+00', 't', '/placeholder.jpg', '0')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.articles ("id", "title", "slug", "excerpt", "content", "thumbnail", "category_id", "author", "read_time", "publish_status", "views", "created_at", "updated_at", "is_active", "featured_image", "views_count") VALUES ('6082ae34-0822-4f2c-920d-193c71649100', 'ÙØ¶Ù„ Ù‚Ø±Ø§Ø¡Ø© Ø§Ù„Ù‚Ø±Ø¢Ù†', 'virtues-reading-quran', 'Ù…Ù‚Ø§Ù„ Ø¹Ù† ÙØ¶Ø§Ø¦Ù„ ØªÙ„Ø§ÙˆØ© Ø§Ù„Ù‚Ø±Ø¢Ù† Ø§Ù„ÙƒØ±ÙŠÙ… ÙˆØ«ÙˆØ§Ø¨Ù‡Ø§', 'Ø§Ù„Ù‚Ø±Ø¢Ù† Ø§Ù„ÙƒØ±ÙŠÙ… ÙƒÙ„Ø§Ù… Ø§Ù„Ù„Ù‡ Ø§Ù„Ù…Ù†Ø²Ù„ Ø¹Ù„Ù‰ Ù†Ø¨ÙŠÙ‡ Ù…Ø­Ù…Ø¯ ØµÙ„Ù‰ Ø§Ù„Ù„Ù‡ Ø¹Ù„ÙŠÙ‡ ÙˆØ³Ù„Ù…...Ù‚Ø§Ù„ Ø§Ù„Ù†Ø¨ÙŠ ØµÙ„Ù‰ Ø§Ù„Ù„Ù‡ Ø¹Ù„ÙŠÙ‡ ÙˆØ³Ù„Ù…: "Ø§Ù‚Ø±Ø£ÙˆØ§ Ø§Ù„Ù‚Ø±Ø¢Ù† ÙØ¥Ù†Ù‡ ÙŠØ£ØªÙŠ ÙŠÙˆÙ… Ø§Ù„Ù‚ÙŠØ§Ù…Ø© Ø´ÙÙŠØ¹Ø§Ù‹ Ù„Ø£ØµØ­Ø§Ø¨Ù‡"...## ÙØ¶Ø§Ø¦Ù„ ØªÙ„Ø§ÙˆØ© Ø§Ù„Ù‚Ø±Ø¢Ù†- Ø§Ù„Ø­Ø³Ù†Ø© Ø¨Ø¹Ø´Ø± Ø£Ù…Ø«Ø§Ù„Ù‡Ø§- Ø§Ù„Ø±ÙØ¹Ø© ÙÙŠ Ø§Ù„Ø¯Ù†ÙŠØ§ ÙˆØ§Ù„Ø¢Ø®Ø±Ø©- Ø§Ù„Ø´ÙØ§Ø¹Ø© ÙŠÙˆÙ… Ø§Ù„Ù‚ÙŠØ§Ù…Ø©...', '/placeholder.svg', 'cbfa57a9-da3f-467b-b9ff-e5ec0b986ade', 'Ø§Ù„Ø´ÙŠØ® Ø§Ù„Ø³ÙŠØ¯ Ù…Ø±Ø§Ø¯', '6', 'published', '420', '2026-01-03 02:22:04.349758+00', '2026-01-03 02:22:04.349758+00', 't', '/placeholder.jpg', '0')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.articles ("id", "title", "slug", "excerpt", "content", "thumbnail", "category_id", "author", "read_time", "publish_status", "views", "created_at", "updated_at", "is_active", "featured_image", "views_count") VALUES ('40c600f8-858d-497b-b80f-a2e2e5b3ab10', 'Ø¢Ø¯Ø§Ø¨ Ø§Ù„Ù…Ø³Ø¬Ø¯', 'mosque-etiquette', 'Ù…Ù‚Ø§Ù„ Ø¹Ù† Ø¢Ø¯Ø§Ø¨ Ø¯Ø®ÙˆÙ„ Ø§Ù„Ù…Ø³Ø¬Ø¯ ÙˆØ§Ù„ØµÙ„Ø§Ø© ÙÙŠÙ‡', 'Ø§Ù„Ù…Ø³Ø§Ø¬Ø¯ Ø¨ÙŠÙˆØª Ø§Ù„Ù„Ù‡ ÙÙŠ Ø§Ù„Ø£Ø±Ø¶ØŒ ÙˆÙ‡ÙŠ Ø£Ø­Ø¨ Ø§Ù„Ø¨Ù‚Ø§Ø¹ Ø¥Ù„Ù‰ Ø§Ù„Ù„Ù‡ ØªØ¹Ø§Ù„Ù‰...## Ø¢Ø¯Ø§Ø¨ Ø§Ù„Ø°Ù‡Ø§Ø¨ Ø¥Ù„Ù‰ Ø§Ù„Ù…Ø³Ø¬Ø¯1. Ø§Ù„ØªØ·ÙŠØ¨ ÙˆØ§Ù„ØªØ²ÙŠÙ†2. Ø§Ù„Ù…Ø´ÙŠ Ø¨Ø³ÙƒÙŠÙ†Ø© ÙˆÙˆÙ‚Ø§Ø±3. Ø§Ù„Ø¯Ø¹Ø§Ø¡ Ø¹Ù†Ø¯ Ø¯Ø®ÙˆÙ„ Ø§Ù„Ù…Ø³Ø¬Ø¯...', '/placeholder.svg', 'd88cb77d-03be-4862-a0c2-53b2dba45258', 'Ø§Ù„Ø´ÙŠØ® Ø§Ù„Ø³ÙŠØ¯ Ù…Ø±Ø§Ø¯', '5', 'published', '280', '2026-01-03 02:22:04.349758+00', '2026-01-03 02:22:04.349758+00', 't', '/placeholder.jpg', '0')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.community_pages ("id", "title", "content", "images", "publish_status", "created_at")
VALUES ('6c969881-0cd6-40b5-a6b4-d11fa25bb928', 'Ù†Ø´Ø§Ø·Ø§Øª Ø§Ù„Ù…Ø¬ØªÙ…Ø¹', 'ØµÙØ­Ø© ØªØ¹Ø±Ø¶ Ù†Ø´Ø§Ø·Ø§Øª Ø§Ù„Ù…Ø¬ØªÙ…Ø¹ ÙˆØ§Ù„ÙØ¹Ø§Ù„ÙŠØ§Øª Ø§Ù„Ø¯ÙŠÙ†ÙŠØ© ÙˆØ§Ù„Ø§Ø¬ØªÙ…Ø§Ø¹ÙŠØ© Ø§Ù„ØªÙŠ ÙŠØ´Ø§Ø±Ùƒ ÙÙŠÙ‡Ø§ Ø§Ù„Ø´ÙŠØ®.## Ø§Ù„ÙØ¹Ø§Ù„ÙŠØ§Øª Ø§Ù„Ù‚Ø§Ø¯Ù…Ø©- Ù…Ù„ØªÙ‚Ù‰ Ø§Ù„Ø¹Ù„Ù… Ø§Ù„Ø´Ø±Ø¹ÙŠ Ø§Ù„Ø³Ù†ÙˆÙŠ- Ø¯ÙˆØ±Ø© ØªØ­ÙÙŠØ¸ Ø§Ù„Ù‚Ø±Ø¢Ù† Ø§Ù„ÙƒØ±ÙŠÙ…- Ù…Ø­Ø§Ø¶Ø±Ø§Øª Ø±Ù…Ø¶Ø§Ù†## Ø§Ù„Ù†Ø´Ø§Ø·Ø§Øª Ø§Ù„Ø¯ÙˆØ±ÙŠØ©- Ø­Ù„Ù‚Ø§Øª ØªØ­ÙÙŠØ¸ Ø§Ù„Ù‚Ø±Ø¢Ù†- Ø¯Ø±ÙˆØ³ Ø£Ø³Ø¨ÙˆØ¹ÙŠØ© ÙÙŠ Ø§Ù„Ù…Ø³Ø¬Ø¯- Ø§Ø³ØªØ´Ø§Ø±Ø§Øª Ø´Ø±Ø¹ÙŠØ©', '[]', 'published', '2026-01-03 02:22:04.349758+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.lessons ("id", "title", "description", "content", "audio_url", "video_url", "thumbnail", "duration", "category_id", "series", "episode_number", "publish_status", "views", "created_at", "updated_at", "is_active", "media_url", "media_source", "lesson_type", "type", "thumbnail_path", "views_count", "series_id", "order_in_series")
VALUES ('b65df067-b4b1-4dc5-9e20-7d0608a4b7f1', 'Ø§Ù„Ø³ÙŠØ±Ø© Ø§Ù„Ù†Ø¨ÙˆÙŠØ© - Ø§Ù„Ù…ÙˆÙ„Ø¯ ÙˆØ§Ù„Ù†Ø´Ø£Ø©', 'Ø¯Ø±Ø§Ø³Ø© Ø³ÙŠØ±Ø© Ø§Ù„Ù†Ø¨ÙŠ ØµÙ„Ù‰ Ø§Ù„Ù„Ù‡ Ø¹Ù„ÙŠÙ‡ ÙˆØ³Ù„Ù…', 'Ù†Ø¨Ø¯Ø£ Ø§Ù„ÙŠÙˆÙ… Ø±Ø­Ù„ØªÙ†Ø§ Ù…Ø¹ Ø³ÙŠØ±Ø© Ø®ÙŠØ± Ø§Ù„Ø¨Ø´Ø± Ù…Ø­Ù…Ø¯ ØµÙ„Ù‰ Ø§Ù„Ù„Ù‡ Ø¹Ù„ÙŠÙ‡ ÙˆØ³Ù„Ù…...ÙˆÙ„Ø¯ Ø§Ù„Ù†Ø¨ÙŠ ØµÙ„Ù‰ Ø§Ù„Ù„Ù‡ Ø¹Ù„ÙŠÙ‡ ÙˆØ³Ù„Ù… ÙÙŠ Ø¹Ø§Ù… Ø§Ù„ÙÙŠÙ„ØŒ ÙÙŠ Ø´Ù‡Ø± Ø±Ø¨ÙŠØ¹ Ø§Ù„Ø£ÙˆÙ„...', '/audio/seerah-1.mp3', NULL, NULL, '50:00', '521ff4f2-e6ec-4a39-8fa6-43b759ce7302', 'Ø§Ù„Ø³ÙŠØ±Ø© Ø§Ù„Ù†Ø¨ÙˆÙŠØ©', '1', 'published', '450', '2026-01-03 02:22:04.349758+00', '2026-01-03 02:22:04.349758+00', 't', NULL, 'youtube', 'general', 'video', NULL, '0', NULL, '0')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.lessons ("id", "title", "description", "content", "audio_url", "video_url", "thumbnail", "duration", "category_id", "series", "episode_number", "publish_status", "views", "created_at", "updated_at", "is_active", "media_url", "media_source", "lesson_type", "type", "thumbnail_path", "views_count", "series_id", "order_in_series")
VALUES ('00a3919b-382e-4fed-a65c-bcb31a70714a', 'Ø´Ø±Ø­ ÙƒØªØ§Ø¨ Ø§Ù„Ø·Ù‡Ø§Ø±Ø© - Ø§Ù„Ø¯Ø±Ø³ Ø§Ù„Ø£ÙˆÙ„', 'Ø´Ø±Ø­ Ø£Ø­ÙƒØ§Ù… Ø§Ù„Ø·Ù‡Ø§Ø±Ø© Ù…Ù† ÙƒØªØ§Ø¨ Ø¨Ù„ÙˆØº Ø§Ù„Ù…Ø±Ø§Ù…', 'Ø¨Ø³Ù… Ø§Ù„Ù„Ù‡ Ø§Ù„Ø±Ø­Ù…Ù† Ø§Ù„Ø±Ø­ÙŠÙ…ØŒ Ù†Ø¨Ø¯Ø£ Ø§Ù„ÙŠÙˆÙ… Ø¨Ø´Ø±Ø­ ÙƒØªØ§Ø¨ Ø§Ù„Ø·Ù‡Ø§Ø±Ø©...Ø§Ù„Ø·Ù‡Ø§Ø±Ø© Ø´Ø±Ø· Ù„ØµØ­Ø© Ø§Ù„ØµÙ„Ø§Ø©ØŒ ÙˆÙ‡ÙŠ Ø¹Ù„Ù‰ Ù†ÙˆØ¹ÙŠÙ†: Ø·Ù‡Ø§Ø±Ø© Ø­Ø¯Ø« ÙˆØ·Ù‡Ø§Ø±Ø© Ø®Ø¨Ø«...', '/audio/tahara-1.mp3', NULL, NULL, '45:00', '1dec0a48-f7b9-415e-814a-36f8d8358e5b', 'Ø´Ø±Ø­ Ø¨Ù„ÙˆØº Ø§Ù„Ù…Ø±Ø§Ù…', '1', 'published', '320', '2026-01-03 02:22:04.349758+00', '2026-01-03 02:22:04.349758+00', 't', NULL, 'youtube', 'general', 'video', NULL, '0', NULL, '0')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.privacy_policy ("id", "content", "updated_at")
VALUES ('ee842f07-4558-4f86-9509-d6180ebea397', '# Ø³ÙŠØ§Ø³Ø© Ø§Ù„Ø®ØµÙˆØµÙŠØ©Ù†Ø­Ù† ÙÙŠ Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ø´ÙŠØ® Ø§Ù„Ø³ÙŠØ¯ Ù…Ø±Ø§Ø¯ Ù†Ø­ØªØ±Ù… Ø®ØµÙˆØµÙŠØªÙƒÙ… ÙˆÙ†Ù„ØªØ²Ù… Ø¨Ø­Ù…Ø§ÙŠØ© Ø¨ÙŠØ§Ù†Ø§ØªÙƒÙ… Ø§Ù„Ø´Ø®ØµÙŠØ©.## Ø¬Ù…Ø¹ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§ØªÙ†Ù‚ÙˆÙ… Ø¨Ø¬Ù…Ø¹ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„ØªØ§Ù„ÙŠØ©:- Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ Ø¹Ù†Ø¯ Ø§Ù„Ø§Ø´ØªØ±Ø§Ùƒ ÙÙŠ Ø§Ù„Ù†Ø´Ø±Ø© Ø§Ù„Ø¨Ø±ÙŠØ¯ÙŠØ©- Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„ØªÙˆØ§ØµÙ„ Ø¹Ù†Ø¯ Ø¥Ø±Ø³Ø§Ù„ Ø±Ø³Ø§Ù„Ø©- Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„ØªØµÙØ­ Ù„ØªØ­Ø³ÙŠÙ† ØªØ¬Ø±Ø¨Ø© Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…## Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ø¨ÙŠØ§Ù†Ø§ØªÙ†Ø³ØªØ®Ø¯Ù… Ø¨ÙŠØ§Ù†Ø§ØªÙƒÙ… ÙÙ‚Ø· Ù„Ù„Ø£ØºØ±Ø§Ø¶ Ø§Ù„ØªØ§Ù„ÙŠØ©:- Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„ØªØ­Ø¯ÙŠØ«Ø§Øª ÙˆØ§Ù„Ù…Ø­ØªÙˆÙ‰ Ø§Ù„Ø¬Ø¯ÙŠØ¯- Ø§Ù„Ø±Ø¯ Ø¹Ù„Ù‰ Ø§Ø³ØªÙØ³Ø§Ø±Ø§ØªÙƒÙ…- ØªØ­Ø³ÙŠÙ† Ø®Ø¯Ù…Ø§ØªÙ†Ø§## Ø­Ù…Ø§ÙŠØ© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§ØªÙ†Ù„ØªØ²Ù… Ø¨Ø­Ù…Ø§ÙŠØ© Ø¨ÙŠØ§Ù†Ø§ØªÙƒÙ… ÙˆØ¹Ø¯Ù… Ù…Ø´Ø§Ø±ÙƒØªÙ‡Ø§ Ù…Ø¹ Ø£ÙŠ Ø·Ø±Ù Ø«Ø§Ù„Ø«.## Ø­Ù‚ÙˆÙ‚ÙƒÙ…Ù„Ø¯ÙŠÙƒÙ… Ø§Ù„Ø­Ù‚ ÙÙŠ:- Ø·Ù„Ø¨ Ø§Ù„ÙˆØµÙˆÙ„ Ø¥Ù„Ù‰ Ø¨ÙŠØ§Ù†Ø§ØªÙƒÙ…- Ø·Ù„Ø¨ ØªØµØ­ÙŠØ­ Ø¨ÙŠØ§Ù†Ø§ØªÙƒÙ…- Ø·Ù„Ø¨ Ø­Ø°Ù Ø¨ÙŠØ§Ù†Ø§ØªÙƒÙ…Ø¢Ø®Ø± ØªØ­Ø¯ÙŠØ«: Ø¯ÙŠØ³Ù…Ø¨Ø± 2024', '2026-01-03 02:22:04.349758+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sermons ("id", "title", "description", "content", "audio_url", "video_url", "thumbnail", "duration", "category_id", "publish_status", "views", "created_at", "updated_at", "is_active", "date", "transcript", "views_count", "thumbnail_path", "audio_file_path", "media_source", "youtube_url")
VALUES ('1a5da973-b918-484f-9c6c-85ab3c2519b9', 'Ø®Ø·Ø¨Ø© Ø¹Ù† Ø¨Ø± Ø§Ù„ÙˆØ§Ù„Ø¯ÙŠÙ†', 'Ø®Ø·Ø¨Ø© Ø¬Ù…Ø¹Ø© Ø¹Ù† ÙØ¶Ù„ Ø¨Ø± Ø§Ù„ÙˆØ§Ù„Ø¯ÙŠÙ†', 'Ø§Ù„Ø­Ù…Ø¯ Ù„Ù„Ù‡ Ø§Ù„Ø°ÙŠ Ø¬Ø¹Ù„ Ø¨Ø± Ø§Ù„ÙˆØ§Ù„Ø¯ÙŠÙ† Ù…Ù† Ø£Ø¹Ø¸Ù… Ø§Ù„Ù‚Ø±Ø¨Ø§Øª...Ø¨Ø± Ø§Ù„ÙˆØ§Ù„Ø¯ÙŠÙ† Ù…Ù† Ø£Ø¬Ù„ Ø§Ù„Ø£Ø¹Ù…Ø§Ù„ ÙˆØ£Ø­Ø¨Ù‡Ø§ Ø¥Ù„Ù‰ Ø§Ù„Ù„Ù‡ ØªØ¹Ø§Ù„Ù‰ØŒ ÙˆÙ‚Ø¯ Ù‚Ø±Ù†Ù‡ Ø§Ù„Ù„Ù‡ Ø¨Ø¹Ø¨Ø§Ø¯ØªÙ‡ ÙÙŠ ÙƒØªØ§Ø¨Ù‡ Ø§Ù„ÙƒØ±ÙŠÙ…...', '/audio/parents.mp3', NULL, NULL, '22:15', '0df9f0a2-60a6-45d0-95cb-3640cca5aef3', 'published', '200', '2026-01-03 02:22:04.349758+00', '2026-01-03 02:22:04.349758+00', 't', '2026-01-03', NULL, '0', NULL, NULL, 'local', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sermons ("id", "title", "description", "content", "audio_url", "video_url", "thumbnail", "duration", "category_id", "publish_status", "views", "created_at", "updated_at", "is_active", "date", "transcript", "views_count", "thumbnail_path", "audio_file_path", "media_source", "youtube_url")
VALUES ('39651788-6a6e-48b5-b5da-704c7240f64c', 'Ø®Ø·Ø¨Ø© Ø¹Ù† Ø§Ù„ØµØ¨Ø±', 'Ø®Ø·Ø¨Ø© Ø¬Ù…Ø¹Ø© Ø¹Ù† Ø§Ù„ØµØ¨Ø± ÙˆÙØ¶Ù„Ù‡', 'Ø§Ù„Ø­Ù…Ø¯ Ù„Ù„Ù‡ Ø±Ø¨ Ø§Ù„Ø¹Ø§Ù„Ù…ÙŠÙ†ØŒ Ø§Ù„Ø°ÙŠ ÙˆØ¹Ø¯ Ø§Ù„ØµØ§Ø¨Ø±ÙŠÙ† Ø£Ø¬Ø±Ù‡Ù… Ø¨ØºÙŠØ± Ø­Ø³Ø§Ø¨...Ø§Ù„ØµØ¨Ø± Ù†ØµÙ Ø§Ù„Ø¥ÙŠÙ…Ø§Ù†ØŒ ÙˆÙ‡Ùˆ Ù…Ù† Ø£Ø¹Ø¸Ù… Ø§Ù„Ø¹Ø¨Ø§Ø¯Ø§Øª Ø§Ù„ØªÙŠ ÙŠØªÙ‚Ø±Ø¨ Ø¨Ù‡Ø§ Ø§Ù„Ø¹Ø¨Ø¯ Ø¥Ù„Ù‰ Ø±Ø¨Ù‡...', '/audio/sabr.mp3', NULL, NULL, '28:00', '0df9f0a2-60a6-45d0-95cb-3640cca5aef3', 'published', '180', '2026-01-03 02:22:04.349758+00', '2026-01-03 02:22:04.349758+00', 't', '2026-01-03', NULL, '0', NULL, NULL, 'local', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sermons ("id", "title", "description", "content", "audio_url", "video_url", "thumbnail", "duration", "category_id", "publish_status", "views", "created_at", "updated_at", "is_active", "date", "transcript", "views_count", "thumbnail_path", "audio_file_path", "media_source", "youtube_url")
VALUES ('e331194b-bf39-4efa-8dd7-74e631d01104', 'Ø®Ø·Ø¨Ø© Ø¹Ù† Ø§Ù„ØªÙ‚ÙˆÙ‰', 'Ø®Ø·Ø¨Ø© Ø¬Ù…Ø¹Ø© Ø¹Ù† Ø£Ù‡Ù…ÙŠØ© Ø§Ù„ØªÙ‚ÙˆÙ‰ ÙÙŠ Ø­ÙŠØ§Ø© Ø§Ù„Ù…Ø³Ù„Ù…', 'Ø§Ù„Ø­Ù…Ø¯ Ù„Ù„Ù‡ Ø±Ø¨ Ø§Ù„Ø¹Ø§Ù„Ù…ÙŠÙ†ØŒ ÙˆØ§Ù„ØµÙ„Ø§Ø© ÙˆØ§Ù„Ø³Ù„Ø§Ù… Ø¹Ù„Ù‰ Ø£Ø´Ø±Ù Ø§Ù„Ø£Ù†Ø¨ÙŠØ§Ø¡ ÙˆØ§Ù„Ù…Ø±Ø³Ù„ÙŠÙ†...Ø§Ù„ØªÙ‚ÙˆÙ‰ Ù‡ÙŠ ÙˆØµÙŠØ© Ø§Ù„Ù„Ù‡ Ù„Ù„Ø£ÙˆÙ„ÙŠÙ† ÙˆØ§Ù„Ø¢Ø®Ø±ÙŠÙ†ØŒ Ù‚Ø§Ù„ ØªØ¹Ø§Ù„Ù‰: "ÙˆÙ„Ù‚Ø¯ ÙˆØµÙŠÙ†Ø§ Ø§Ù„Ø°ÙŠÙ† Ø£ÙˆØªÙˆØ§ Ø§Ù„ÙƒØªØ§Ø¨ Ù…Ù† Ù‚Ø¨Ù„ÙƒÙ… ÙˆØ¥ÙŠØ§ÙƒÙ… Ø£Ù† Ø§ØªÙ‚ÙˆØ§ Ø§Ù„Ù„Ù‡"...', '/audio/taqwa.mp3', NULL, NULL, '25:30', '0df9f0a2-60a6-45d0-95cb-3640cca5aef3', 'published', '150', '2026-01-03 02:22:04.349758+00', '2026-01-03 02:22:04.349758+00', 't', '2026-01-03', NULL, '1', NULL, NULL, 'local', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.terms_conditions ("id", "content", "updated_at")
VALUES ('cbc5ef5f-b6f4-47da-a862-3dc66b3092f0', '# Ø´Ø±ÙˆØ· Ø§Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù…Ø¨Ø§Ø³ØªØ®Ø¯Ø§Ù…Ùƒ Ù„Ù‡Ø°Ø§ Ø§Ù„Ù…ÙˆÙ‚Ø¹ ÙØ¥Ù†Ùƒ ØªÙˆØ§ÙÙ‚ Ø¹Ù„Ù‰ Ø§Ù„Ø´Ø±ÙˆØ· Ø§Ù„ØªØ§Ù„ÙŠØ©:## Ø§Ù„Ù…Ø­ØªÙˆÙ‰- Ø¬Ù…ÙŠØ¹ Ø§Ù„Ù…Ø­ØªÙˆÙŠØ§Øª Ù…Ø­Ù…ÙŠØ© Ø¨Ø­Ù‚ÙˆÙ‚ Ø§Ù„Ø·Ø¨Ø¹ ÙˆØ§Ù„Ù†Ø´Ø±- ÙŠÙØ³Ù…Ø­ Ø¨Ù…Ø´Ø§Ø±ÙƒØ© Ø§Ù„Ù…Ø­ØªÙˆÙ‰ Ù…Ø¹ Ø°ÙƒØ± Ø§Ù„Ù…ØµØ¯Ø±- Ù„Ø§ ÙŠÙØ³Ù…Ø­ Ø¨Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ù…Ø­ØªÙˆÙ‰ Ù„Ø£ØºØ±Ø§Ø¶ ØªØ¬Ø§Ø±ÙŠØ© Ø¯ÙˆÙ† Ø¥Ø°Ù† Ù…Ø³Ø¨Ù‚## Ø§Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ù…Ù‚Ø¨ÙˆÙ„- Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ù„Ù„Ø£ØºØ±Ø§Ø¶ Ø§Ù„Ø´Ø®ØµÙŠØ© ÙˆØ§Ù„ØªØ¹Ù„ÙŠÙ…ÙŠØ©- Ø¹Ø¯Ù… Ù†Ø´Ø± Ù…Ø­ØªÙˆÙ‰ Ù…Ø³ÙŠØ¡ Ø£Ùˆ Ù…Ø®Ø§Ù„Ù Ù„Ù„Ø´Ø±ÙŠØ¹Ø©- Ø§Ø­ØªØ±Ø§Ù… Ø­Ù‚ÙˆÙ‚ Ø§Ù„Ù…Ù„ÙƒÙŠØ© Ø§Ù„ÙÙƒØ±ÙŠØ©## Ø§Ù„ØªØ¹Ù„ÙŠÙ‚Ø§Øª- ÙŠØ¬Ø¨ Ø£Ù† ØªÙƒÙˆÙ† Ø§Ù„ØªØ¹Ù„ÙŠÙ‚Ø§Øª Ù…Ø­ØªØ±Ù…Ø© ÙˆØ¨Ù†Ø§Ø¡Ø©- Ù†Ø­ØªÙØ¸ Ø¨Ø­Ù‚ Ø­Ø°Ù Ø§Ù„ØªØ¹Ù„ÙŠÙ‚Ø§Øª ØºÙŠØ± Ø§Ù„Ù„Ø§Ø¦Ù‚Ø©- Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ù…Ø³Ø¤ÙˆÙ„ Ø¹Ù† Ù…Ø­ØªÙˆÙ‰ ØªØ¹Ù„ÙŠÙ‚Ø§ØªÙ‡## Ø¥Ø®Ù„Ø§Ø¡ Ø§Ù„Ù…Ø³Ø¤ÙˆÙ„ÙŠØ©Ø§Ù„Ù…Ø­ØªÙˆÙ‰ Ø§Ù„Ù…Ù‚Ø¯Ù… Ù‡Ùˆ Ù„Ù„Ø£ØºØ±Ø§Ø¶ Ø§Ù„ØªØ¹Ù„ÙŠÙ…ÙŠØ© ÙˆØ§Ù„ØªÙˆØ¹ÙˆÙŠØ©ØŒ ÙˆÙ†Ù†ØµØ­ Ø¨Ø§Ù„Ø±Ø¬ÙˆØ¹ Ø¥Ù„Ù‰ Ø£Ù‡Ù„ Ø§Ù„Ø¹Ù„Ù… ÙÙŠ Ø§Ù„Ù…Ø³Ø§Ø¦Ù„ Ø§Ù„Ø®Ø§ØµØ©.Ø¢Ø®Ø± ØªØ­Ø¯ÙŠØ«: Ø¯ÙŠØ³Ù…Ø¨Ø± 2024', '2026-01-03 02:22:04.349758+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.weekly_schedule ("id", "day_name", "time", "title", "location", "description", "is_active", "sort_order", "created_at")
VALUES ('0de97ec6-0f7c-44e3-a511-7d682b3241bf', 'Ø§Ù„Ø¬Ù…Ø¹Ø©', 'Ø¨Ø¹Ø¯ ØµÙ„Ø§Ø© Ø§Ù„Ø¬Ù…Ø¹Ø©', 'Ø¯Ø±Ø³ Ø¹Ø§Ù…', 'Ù…Ø³Ø¬Ø¯ Ø§Ù„Ø±Ø­Ù…Ù†', 'Ø¯Ø±Ø³ Ø¹Ø§Ù… ÙÙŠ Ù…Ø®ØªÙ„Ù Ø§Ù„Ø¹Ù„ÙˆÙ… Ø§Ù„Ø´Ø±Ø¹ÙŠØ©', 't', '5', '2026-01-03 02:22:04.349758+00')
ON CONFLICT (id) DO NOTHING;

-- Add missing columns to hero_section table
ALTER TABLE public.hero_section ADD COLUMN IF NOT EXISTS hadith_arabic text;
ALTER TABLE public.hero_section ADD COLUMN IF NOT EXISTS hadith_translation text;
ALTER TABLE public.hero_section ADD COLUMN IF NOT EXISTS hadith_explanation text;
ALTER TABLE public.hero_section ADD COLUMN IF NOT EXISTS hadith_button_text text DEFAULT 'اقرأ المزيد'::text;
ALTER TABLE public.hero_section ADD COLUMN IF NOT EXISTS hadith_button_link text DEFAULT '/articles'::text;
ALTER TABLE public.hero_section ADD COLUMN IF NOT EXISTS book_custom_text text DEFAULT 'أحدث إصدارات الشيخ'::text;
ALTER TABLE public.hero_section ADD COLUMN IF NOT EXISTS book_button_text text DEFAULT 'تصفح الكتب'::text;
ALTER TABLE public.hero_section ADD COLUMN IF NOT EXISTS book_button_link text DEFAULT '/books'::text;
ALTER TABLE public.hero_section ADD COLUMN IF NOT EXISTS important_notice text;
ALTER TABLE public.hero_section ADD COLUMN IF NOT EXISTS important_notice_link text;
ALTER TABLE public.hero_section ADD COLUMN IF NOT EXISTS show_important_notice boolean DEFAULT false;
ALTER TABLE public.hero_section ADD COLUMN IF NOT EXISTS underline_text text;

-- Add new columns to contact_settings table
ALTER TABLE public.contact_settings ADD COLUMN IF NOT EXISTS important_notice text;
ALTER TABLE public.contact_settings ADD COLUMN IF NOT EXISTS phone character varying(255);
ALTER TABLE public.contact_settings ADD COLUMN IF NOT EXISTS whatsapp_number character varying(255);
ALTER TABLE public.contact_settings ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.contact_settings ADD COLUMN IF NOT EXISTS notice_enabled boolean DEFAULT true;
ALTER TABLE public.contact_settings ADD COLUMN IF NOT EXISTS subject_options jsonb DEFAULT '["استفسار عام", "طلب فتوى", "اقتراح", "شكوى", "أخرى"]'::jsonb;

-- Update existing contact_settings to include new columns
UPDATE public.contact_settings SET
  important_notice = 'هذا النموذج مخصص للتواصل العام والاقتراحات التقنية. لا يقدم الموقع فتاوى شرعية ولا يتم الرد على الأسئلة الفقهية عبر هذا النموذج.',
  subject_options = '["استفسار عام", "طلب فتوى", "اقتراح", "شكوى", "أخرى"]'::jsonb,
  notice_enabled = true
WHERE important_notice IS NULL;

-- Add new columns to contact_messages table
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false;

-- Update existing contact_messages to have is_favorite default
UPDATE public.contact_messages SET is_favorite = false WHERE is_favorite IS NULL;

-- Update existing articles to have default placeholder images only if they are completely empty
UPDATE public.articles SET
  thumbnail = '/placeholder.svg'
WHERE thumbnail IS NULL OR thumbnail = '';

UPDATE public.articles SET
  featured_image = '/placeholder.jpg'
WHERE featured_image IS NULL OR featured_image = '';

INSERT INTO public.hero_section ("id", "hadith_text", "hadith_source", "button_text", "button_link", "featured_book_id", "background_image", "is_active", "updated_at", "pop_button_link", "pop_button_text", "announcement_text", "announcement_enabled", "hadith_arabic", "hadith_translation", "hadith_explanation", "hadith_button_text", "hadith_button_link", "book_custom_text", "book_button_text", "book_button_link", "important_notice", "important_notice_link", "show_important_notice", "underline_text")
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'الحديث النصي هنا', 'صحيح البخاري', 'اقرأ المزيد', '/articles', NULL, NULL, true, '2026-01-03 02:22:04.349758+00', NULL, NULL, NULL, false, 'الحديث النصي هنا', 'صحيح البخاري', 'شرح الحديث', 'اقرأ المزيد', '/articles', 'أحدث إصدارات الشيخ', 'تصفح الكتب', '/books', NULL, NULL, false, 'الدين الإسلامي')
ON CONFLICT (id) DO UPDATE SET
    hadith_arabic = EXCLUDED.hadith_arabic,
    hadith_translation = EXCLUDED.hadith_translation,
    hadith_explanation = EXCLUDED.hadith_explanation,
    hadith_button_text = EXCLUDED.hadith_button_text,
    hadith_button_link = EXCLUDED.hadith_button_link,
    book_custom_text = EXCLUDED.book_custom_text,
    book_button_text = EXCLUDED.book_button_text,
    book_button_link = EXCLUDED.book_button_link,
    important_notice = EXCLUDED.important_notice,
    important_notice_link = EXCLUDED.important_notice_link,
    show_important_notice = EXCLUDED.show_important_notice,
    underline_text = EXCLUDED.underline_text,
    updated_at = EXCLUDED.updated_at;---- TOC entry 4619 (class 0 OID 17076)-- Dependencies: 264-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin--INSERT INTO realtime.schema_migrations ("version", "inserted_at") VALUES ('20211116024918', '2026-01-03 00:42:31');

CREATE INDEX IF NOT EXISTS idx_analytics_content ON public.analytics USING btree (content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON public.analytics USING btree (date);
CREATE INDEX IF NOT EXISTS idx_articles_is_active ON public.articles USING btree (is_active);
CREATE INDEX IF NOT EXISTS idx_books_is_active ON public.books USING btree (is_active);
CREATE INDEX IF NOT EXISTS idx_lessons_category_id ON public.lessons USING btree (category_id);
CREATE INDEX IF NOT EXISTS idx_lessons_is_active ON public.lessons USING btree (is_active);
CREATE INDEX IF NOT EXISTS idx_navbar_items_is_active ON public.navbar_items USING btree (is_active);
-- Add missing column to notifications table
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link character varying(500);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications USING btree (is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_source ON public.notifications USING btree (source_id, source_type);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications USING btree (type);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications USING btree (is_read, created_at);
CREATE INDEX IF NOT EXISTS idx_sermons_category_id ON public.sermons USING btree (category_id);
CREATE INDEX IF NOT EXISTS idx_sermons_is_active ON public.sermons USING btree (is_active);
CREATE INDEX IF NOT EXISTS idx_weekly_schedule_is_active ON public.weekly_schedule USING btree (is_active);

-- Insert default appearance settings with logo
INSERT INTO public.appearance_settings (
    id,
    primary_color,
    secondary_color,
    site_logo_path,
    site_logo_path_dark,
    updated_at
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    '#1e4338',
    '#d4af37',
    '/placeholder-logo.png',
    '/placeholder-logo.png',
    now()
) ON CONFLICT (id) DO UPDATE SET
    site_logo_path = EXCLUDED.site_logo_path,
    site_logo_path_dark = EXCLUDED.site_logo_path_dark,
    updated_at = now();
