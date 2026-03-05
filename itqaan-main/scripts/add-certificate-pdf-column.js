import { Pool } from 'pg';
import dns from 'dns';
import { config } from 'dotenv';

config({ path: '.env.local' });
dns.setDefaultResultOrder('ipv4first');

async function addCertificatePdfColumn() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    // Add certificate_pdf_url column if it doesn't exist
    await pool.query(`
      ALTER TABLE certificate_data
      ADD COLUMN IF NOT EXISTS certificate_pdf_url TEXT;
    `);
    console.log('Added certificate_pdf_url column successfully');
  } catch (error) {
    console.error('Error adding column:', error);
  } finally {
    await pool.end();
  }
}

addCertificatePdfColumn();
