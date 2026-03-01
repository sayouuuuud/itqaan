import { Pool } from 'pg';
import dns from 'dns';
import { config } from 'dotenv';

config({ path: '.env.local' });
dns.setDefaultResultOrder('ipv4first');

async function checkTemplates() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('DATABASE_URL is missing!');
        return;
    }

    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const result = await pool.query('SELECT template_key, is_active FROM email_templates');
        console.log('Actual Templates in DB:', result.rows);
    } catch (error) {
        console.error('Final DB Check Error:', error);
    } finally {
        await pool.end();
    }
}

checkTemplates();
