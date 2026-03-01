import { query } from './lib/db.js';

async function checkUser() {
    const users = await query('SELECT email FROM users WHERE email = $1', ['sayedelshazly2006@gmail.com']);
    console.log('User found:', users);
}

checkUser();
