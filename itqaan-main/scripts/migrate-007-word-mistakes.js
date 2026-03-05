require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    console.log('Running migration 007: word mistakes table...');
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Create word_mistakes table
        await client.query(`
      CREATE TABLE IF NOT EXISTS word_mistakes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        recitation_id UUID REFERENCES recitations(id) ON DELETE CASCADE,
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        reader_id UUID REFERENCES users(id) ON DELETE CASCADE,
        word VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

        // Create index for fast lookups by student or reciter
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_word_mistakes_student ON word_mistakes(student_id);
      CREATE INDEX IF NOT EXISTS idx_word_mistakes_reader ON word_mistakes(reader_id);
    `);

        await client.query('COMMIT');
        console.log('Migration 007 completed successfully.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
