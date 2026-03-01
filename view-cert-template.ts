import { Pool } from 'pg';
import dns from 'dns';
import { config } from 'dotenv';

config({ path: '.env.local' });
dns.setDefaultResultOrder('ipv4first');

async function viewTemplate() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

    try {
        const result = await pool.query("SELECT subject_ar, body_ar FROM email_templates WHERE template_key = 'certificate_issued'");
        console.log('Template Content:', result.rows[0]);
    } catch (error) {
        console.error('Error viewing template:', error);
    } finally {
        await pool.end();
    }
}

viewTemplate();
