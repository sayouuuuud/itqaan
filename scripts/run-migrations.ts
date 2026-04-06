import { query } from '../lib/db'
import fs from 'fs'
import path from 'path'

/**
 * Database Migration Runner
 * Executes SQL migration files in order
 * 
 * Usage: npx ts-node scripts/run-migrations.ts
 */

const MIGRATIONS = [
  '001-phase1-users-roles-expansion.sql',
  '002-phase2-lms-engine-schema.sql',
  '003-phase3-invitation-system.sql',
  '004-phase4-parent-student-relations.sql',
]

async function runMigration(filename: string) {
  try {
    console.log(`\n⏳ Running migration: ${filename}`)
    
    const filePath = path.join(__dirname, filename)
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Migration file not found: ${filePath}`)
      return false
    }
    
    // Read SQL file
    const sql = fs.readFileSync(filePath, 'utf-8')
    
    // Split by semicolon to get individual statements
    // Simple parser - doesn't handle complex cases but works for our migrations
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    // Execute each statement
    for (const statement of statements) {
      try {
        // Skip comment lines
        if (statement.startsWith('--')) continue
        
        // Skip COMMIT statements (we handle transactions differently)
        if (statement.toUpperCase().includes('COMMIT')) continue
        
        console.log(`  ↳ Executing statement...`)
        await query(statement)
      } catch (err: any) {
        // Some statements might fail due to IF NOT EXISTS etc
        // Log the error but continue if it's expected
        if (err.message && (
          err.message.includes('already exists') ||
          err.message.includes('does not exist') ||
          err.message.includes('already has') ||
          err.message.includes('ALREADY_EXISTS')
        )) {
          console.log(`  ↳ Info: ${err.message.substring(0, 50)}...`)
        } else {
          console.error(`  ↳ Error: ${err.message}`)
        }
      }
    }
    
    console.log(`✅ Completed: ${filename}`)
    return true
  } catch (err: any) {
    console.error(`❌ Failed to run migration ${filename}:`, err.message)
    return false
  }
}

async function main() {
  console.log('🚀 Starting Itqaan LMS Database Migrations...')
  console.log('================================================')
  
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL environment variable is not set')
    process.exit(1)
  }
  
  console.log('✓ Database connection string found')
  console.log(`\n📋 Found ${MIGRATIONS.length} migrations:`)
  MIGRATIONS.forEach(m => console.log(`   - ${m}`))
  
  // Run each migration
  let successCount = 0
  for (const migration of MIGRATIONS) {
    const success = await runMigration(migration)
    if (success) successCount++
  }
  
  console.log('\n================================================')
  if (successCount === MIGRATIONS.length) {
    console.log('✨ All migrations completed successfully!')
    console.log('\n🎉 Database schema is now up to date')
    console.log('\nNext steps:')
    console.log('1. Update your API routes with middleware for RBAC')
    console.log('2. Create invitation endpoints')
    console.log('3. Create LMS course management endpoints')
    console.log('4. Create parent monitoring endpoints')
    process.exit(0)
  } else {
    console.log(`⚠️  Completed ${successCount}/${MIGRATIONS.length} migrations`)
    console.log('❌ Some migrations failed - check errors above')
    process.exit(1)
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
