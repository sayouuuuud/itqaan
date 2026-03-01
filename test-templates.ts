import { config } from 'dotenv';
config({ path: '.env.local' });
import { query } from './lib/db';

async function checkTemplates() {
    const templates = await query('SELECT template_key, is_active FROM email_templates');
    console.log('Templates in DB:', templates);
}

checkTemplates();
