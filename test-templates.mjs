import { query } from './lib/db.js';

async function checkTemplates() {
    const templates = await query('SELECT template_key, is_active FROM email_templates');
    console.log('Templates in DB:', templates);
}

checkTemplates();
