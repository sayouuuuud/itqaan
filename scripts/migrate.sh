#!/bin/bash
# Migration Runner Script
# Executes all database migrations in the correct order

set -e  # Exit on any error

echo "🚀 Starting Itqaan LMS Database Migrations..."
echo "================================================"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Run migrations in order
MIGRATIONS=(
    "001-phase1-users-roles-expansion.sql"
    "002-phase2-lms-engine-schema.sql"
    "003-phase3-invitation-system.sql"
    "004-phase4-parent-student-relations.sql"
)

echo ""
echo "📋 Found migrations:"
for migration in "${MIGRATIONS[@]}"; do
    echo "   - $migration"
done
echo ""

# Run each migration
for migration in "${MIGRATIONS[@]}"; do
    MIGRATION_PATH="$SCRIPT_DIR/$migration"
    
    if [ ! -f "$MIGRATION_PATH" ]; then
        echo "❌ ERROR: Migration file not found: $MIGRATION_PATH"
        exit 1
    fi
    
    echo "⏳ Running: $migration"
    psql "$DATABASE_URL" -f "$MIGRATION_PATH" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✅ Completed: $migration"
    else
        echo "❌ FAILED: $migration"
        echo "   Check your database connection and SQL syntax"
        exit 1
    fi
done

echo ""
echo "================================================"
echo "✨ All migrations completed successfully!"
echo ""
echo "🎉 Database schema is now up to date"
echo ""
echo "Next steps:"
echo "1. Update your API routes with middleware for RBAC"
echo "2. Create invitation endpoints"
echo "3. Create LMS course management endpoints"
echo "4. Create parent monitoring endpoints"
