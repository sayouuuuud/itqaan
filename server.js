const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const dns = require('dns');
const { Pool } = require('pg');

// Fix for Node 18+ DNS resolution issues with some shared hosts
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const port = process.env.PORT || 3000;

console.log('--- Hostinger Startup Diagnostics ---');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', port);

// Check critical environment variables (presence only)
const criticalVars = ['DATABASE_URL', 'JWT_SECRET', 'NEXT_PUBLIC_SUPABASE_URL', 'UPLOADTHING_TOKEN'];
criticalVars.forEach(v => {
    console.log(`Checking ${v}:`, process.env[v] ? 'Present ✅' : 'MISSING ❌');
});

async function startServer() {
    try {
        // 1. Test Database Connectivity
        if (process.env.DATABASE_URL) {
            console.log('Attempting to connect to Database...');
            const pool = new Pool({
                connectionString: process.env.DATABASE_URL,
                connectionTimeoutMillis: 5000,
                ssl: { rejectUnauthorized: false }
            });

            try {
                const client = await pool.connect();
                console.log('Database Connection: SUCCESS ✅');
                client.release();
                await pool.end();
            } catch (dbError) {
                console.error('Database Connection: FAILED ❌');
                console.error('Error Detail:', dbError.message);
                if (dbError.message.includes('ETIMEDOUT')) {
                    console.error('Hint: Hostinger might be blocking the database port or IPv6 address.');
                }
            }
        } else {
            console.warn('DATABASE_URL is not set. Skipping DB test.');
        }

        // 2. Prepare Next.js
        console.log('Preparing Next.js app...');
        await app.prepare();
        console.log('Next.js Ready ✅');

        // 3. Create Server
        createServer((req, res) => {
            const parsedUrl = parse(req.url, true);
            handle(req, res, parsedUrl);
        }).listen(port, (err) => {
            if (err) throw err;
            console.log(`> Ready on http://localhost:${port}`);
        });

    } catch (err) {
        console.error('FATAL ERROR DURING STARTUP:');
        console.error(err);
        process.exit(1);
    }
}

startServer();

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down...');
    process.exit(0);
});
