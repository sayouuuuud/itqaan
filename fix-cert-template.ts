import { Pool } from 'pg';
import dns from 'dns';
import { config } from 'dotenv';

config({ path: '.env.local' });
dns.setDefaultResultOrder('ipv4first');

async function fixTemplate() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

    const templateKey = 'certificate_issued';
    const subject = 'مبارك! تم إصدار شهادتك من منصة إتقان';
    const body = 'أهلاً يا {{studentName}}،\n\nنهنئك على إتمام تلاوة سورة الفاتحة بنجاح وإتقان. تم إصدار شهادتك الرسمية الآن.\n\nيمكنك عرض وتحميل شهادتك من خلال الرابط التالي:\n{{certificateLink}}\n\nمع تحيات إدارة منصة إتقان الفاتحة.';

    try {
        // Check if it exists first
        const check = await pool.query('SELECT id FROM email_templates WHERE template_key = $1', [templateKey]);

        if (check.rows.length > 0) {
            await pool.query(
                'UPDATE email_templates SET subject_ar = $1, body_ar = $2, is_active = true, updated_at = NOW() WHERE template_key = $3',
                [subject, body, templateKey]
            );
            console.log('Template updated successfully');
        } else {
            await pool.query(
                "INSERT INTO email_templates (template_key, subject_ar, body_ar, is_active, template_type) VALUES ($1, $2, $3, true, 'system')",
                [templateKey, subject, body]
            );
            console.log('Template created successfully');
        }
    } catch (error) {
        console.error('Error fixing template:', error);
    } finally {
        await pool.end();
    }
}

fixTemplate();
