const { Pool } = require('pg')

const pool = new Pool({
    connectionString: 'postgresql://postgres.yonstxadonhuchfierux:5MLfJX0Il4NkvA9X@aws-1-eu-west-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
})

async function run() {
    const steps = [
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100)`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS qualification VARCHAR(255)`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS memorized_parts INTEGER DEFAULT 0`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS years_of_experience INTEGER DEFAULT 0`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name_triple VARCHAR(255)`,
        `UPDATE users u SET city = COALESCE(u.city, rp.city), qualification = COALESCE(u.qualification, rp.qualification), memorized_parts = COALESCE(u.memorized_parts, rp.memorized_parts), years_of_experience = COALESCE(u.years_of_experience, rp.years_of_experience), full_name_triple = COALESCE(u.full_name_triple, rp.full_name_triple), phone = COALESCE(u.phone, rp.phone) FROM reader_profiles rp WHERE rp.user_id = u.id`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('show_certificate_section', 'true', 'general', 'Show/hide certificate section', true) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('show_years_of_experience', 'true', 'general', 'Show years of experience field', false) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('reader_attachment_required', 'false', 'general', 'Require reader attachment', false) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('certificate_pdf_required', 'false', 'general', 'Require student certificate PDF', false) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('resend_email_on_result_update', 'true', 'notification', 'Resend email when admin updates result', false) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('max_daily_sessions_per_reader', '5', 'general', 'Max daily sessions per reader', false) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('smtp_host', '"smtp.gmail.com"', 'email', 'SMTP host', false) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('smtp_port', '"587"', 'email', 'SMTP port', false) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('smtp_user', '""', 'email', 'SMTP username', false) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('smtp_pass', '""', 'email', 'SMTP password', false) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('smtp_tls', 'true', 'email', 'Use TLS for SMTP', false) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('storage_provider', '"cloudinary"', 'storage', 'Storage provider', false) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('cloud_name', '"dnaq5wkcq"', 'storage', 'Cloudinary cloud name', false) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('cloud_api_key', '"843385111919511"', 'storage', 'Cloudinary API key', false) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('max_file_size_mb', '20', 'storage', 'Max file size MB', false) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('two_factor_auth', 'false', 'security', 'Enable 2FA', false) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('activity_logging', 'true', 'security', 'Enable activity logging', false) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('limit_login_attempts', 'true', 'security', 'Lock after 5 failed logins', false) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('show_qualification_field', 'true', 'general', 'Show qualification field', false) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('certificate_mandatory_for_mastered', 'false', 'general', 'Require certificate for mastered', false) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('session_duration_minutes', '30', 'general', 'Default session duration', false) ON CONFLICT (setting_key) DO NOTHING`,
        `CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key)`,
        `CREATE INDEX IF NOT EXISTS idx_announcements_audience ON announcements(target_audience, is_published)`,
        `CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at DESC)`,
    ]

    for (const sql of steps) {
        try {
            await pool.query(sql)
            console.log('OK:', sql.substring(0, 70))
        } catch (e) {
            console.error('ERR:', sql.substring(0, 70), '->', e.message)
        }
    }

    await pool.end()
    console.log('Done!')
}

run()
