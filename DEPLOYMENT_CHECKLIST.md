# Implementation Checklist & Deployment Guide

## ✅ Pre-Migration Checklist

- [ ] Backup current database
- [ ] Verify DATABASE_URL environment variable is set
- [ ] Check PostgreSQL version (12+ required)
- [ ] Ensure you have admin access to database
- [ ] Review all SQL migration files
- [ ] Read QUICK_REFERENCE.md
- [ ] Have team review schema documentation

---

## 🚀 Migration Execution

### Option 1: Using Node.js (Recommended)
```bash
# Install dependencies (if needed)
npm install pg ts-node

# Run migrations
npx ts-node scripts/run-migrations.ts

# Expected output:
# ⏳ Running: 001-phase1-users-roles-expansion.sql
# ✅ Completed: 001-phase1-users-roles-expansion.sql
# ⏳ Running: 002-phase2-lms-engine-schema.sql
# ✅ Completed: 002-phase2-lms-engine-schema.sql
# ... (continues for phases 3 & 4)
# ✨ All migrations completed successfully!
```

### Option 2: Using psql Directly
```bash
# Run each migration in order
psql $DATABASE_URL -f scripts/001-phase1-users-roles-expansion.sql
psql $DATABASE_URL -f scripts/002-phase2-lms-engine-schema.sql
psql $DATABASE_URL -f scripts/003-phase3-invitation-system.sql
psql $DATABASE_URL -f scripts/004-phase4-parent-student-relations.sql
```

### Option 3: Using Bash Script
```bash
# Make script executable
chmod +x scripts/migrate.sh

# Run migrations
bash scripts/migrate.sh
```

---

## ✔️ Post-Migration Verification

### Step 1: Verify All Tables Created
```bash
psql $DATABASE_URL -c "\dt" | grep -E "categories|courses|lessons|enrollments|invitations|parent_student"
```

**Expected output:** Should show all new tables

### Step 2: Verify All Indexes Created
```bash
psql $DATABASE_URL -c "\di" | grep "idx_"
```

**Expected:** 18+ indexes should be listed

### Step 3: Verify Functions Created
```bash
psql $DATABASE_URL -c "\df" | grep -E "generate_|accept_|get_"
```

**Expected:** Should show PL/pgSQL functions

### Step 4: Test Constraint Enforcement
```sql
-- Test role permissions table
SELECT COUNT(*) FROM role_permissions;
-- Expected: 9 rows

-- Test that new columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'gender';
-- Expected: gender (one row)
```

### Step 5: Test a Simple Insert
```sql
-- Create test category
INSERT INTO categories (name, description) 
VALUES ('Test Category', 'For testing') 
RETURNING id, name;

-- Should return inserted row without error
```

---

## 📋 Code Integration Checklist

### 1. TypeScript Setup
- [ ] Copy `lib/types/lms.ts` into your project (already done ✅)
- [ ] Verify TypeScript compilation: `npm run build`
- [ ] Import types in API routes:
  ```typescript
  import type { Course, Enrollment, User } from '@/lib/types/lms'
  ```

### 2. Middleware Setup
- [ ] Copy `lib/rbac-middleware.ts` (already done ✅)
- [ ] Update auth verification function with your JWT logic
- [ ] Test middleware in a sample endpoint

### 3. Database Connection
- [ ] Verify `lib/db.ts` is using `pg` client
- [ ] Test connection: `await query('SELECT NOW()')`
- [ ] Set up connection pooling (already configured ✅)

### 4. API Route Implementation
For each endpoint, follow this pattern:

```typescript
// 1. Import dependencies
import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { requireRole, forbidden } from '@/lib/rbac-middleware'

// 2. Import types
import type { Course } from '@/lib/types/lms'

// 3. Implement endpoint
export async function POST(req: NextRequest) {
  // 4. Check authorization
  const { user, response } = await requireRole(req, 'TEACHER')
  if (response) return response
  
  // 5. Validate input
  const { title, category_id } = await req.json()
  if (!title || !category_id) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  
  // 6. Execute business logic
  const course = await query<Course>(
    `INSERT INTO courses (title, teacher_id, category_id, is_public)
     VALUES ($1, $2, $3, FALSE)
     RETURNING *`,
    [title, user.id, category_id]
  )
  
  // 7. Return response
  return NextResponse.json(course[0], { status: 201 })
}
```

---

## 🧪 Testing Checklist

### Unit Tests

#### Test RBAC Middleware
```typescript
// __tests__/rbac.test.ts
describe('RBAC Middleware', () => {
  test('requireRole should block non-matching roles', async () => {
    // Setup
    const studentUser = { role: 'STUDENT', id: '123' }
    
    // Test
    const allowed = await requireRole(req, 'TEACHER')
    
    // Assert
    expect(allowed.response.status).toBe(403)
  })
  
  test('checkCourseAccess should allow public courses', async () => {
    // Setup: public course
    
    // Test
    const { canAccess } = await checkCourseAccess(courseId, userId)
    
    // Assert
    expect(canAccess).toBe(true)
  })
})
```

#### Test Access Control
```typescript
test('Private courses should require enrollment', async () => {
  // Setup: private course, no enrollment
  
  // Test
  const { canAccess } = await checkCourseAccess(courseId, userId)
  
  // Assert: should be false
  expect(canAccess).toBe(false)
})
```

### Integration Tests

#### Test Invitation Flow
```typescript
test('Invitation lifecycle', async () => {
  // 1. Create invitation
  const inv = await query(...)
  expect(inv.status).toBe('PENDING')
  
  // 2. Validate token
  const valid = await validateToken(inv.token)
  expect(valid).toBe(true)
  
  // 3. Create user
  const user = await query(...)
  
  // 4. Accept invitation
  await acceptInvitation(inv.token, user.id)
  
  // 5. Verify status changed
  const updated = await queryOne(..., [inv.id])
  expect(updated.status).toBe('ACCEPTED')
})
```

#### Test Course Creation
```typescript
test('Teachers can create courses', async () => {
  const teacher = { id: '123', role: 'TEACHER' }
  
  const course = await query(
    `INSERT INTO courses (title, teacher_id, category_id, is_public)
     VALUES ($1, $2, $3, FALSE)
     RETURNING *`,
    ['Test Course', teacher.id, categoryId]
  )
  
  expect(course[0].teacher_id).toBe(teacher.id)
})

test('Non-teachers cannot create courses', async () => {
  const student = { id: '456', role: 'STUDENT' }
  
  const { response } = await requireRole(req, 'TEACHER')
  
  expect(response.status).toBe(403)
})
```

### Manual Testing

#### Test 1: Admin Creates Invitation
```bash
curl -X POST http://localhost:3000/api/invitations \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "role_to_assign": "TEACHER",
    "target_course_id": null
  }'

# Expected: 201 with invitation token
```

#### Test 2: Teacher Creates Course
```bash
curl -X POST http://localhost:3000/api/courses \
  -H "Authorization: Bearer TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fiqh 101",
    "category_id": "cat-uuid-here",
    "is_public": false
  }'

# Expected: 201 with course data
```

#### Test 3: Student Cannot Create Course
```bash
curl -X POST http://localhost:3000/api/courses \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fiqh 101",
    "category_id": "cat-uuid-here",
    "is_public": false
  }'

# Expected: 403 Forbidden
```

---

## 📊 Database Verification Queries

Run these to verify everything is working:

```sql
-- 1. Check all new tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 2. Verify gender column exists
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'gender';

-- 3. Count indexes created
SELECT COUNT(*) as index_count FROM pg_indexes 
WHERE tablename LIKE '%courses%' OR tablename LIKE '%enrollments%';

-- 4. Verify functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public';

-- 5. Test role permissions
INSERT INTO role_permissions (role, description) 
VALUES ('TEST_ROLE', 'Test') 
RETURNING *;

-- 6. Test course creation
INSERT INTO categories (name) VALUES ('Test Cat');
INSERT INTO courses (title, teacher_id, category_id, is_public)
SELECT 'Test', id, (SELECT id FROM categories WHERE name='Test Cat'), false
FROM users WHERE role='ADMIN' LIMIT 1
RETURNING id, title, teacher_id;
```

---

## 🚨 Troubleshooting

### Issue: Migration fails with "permission denied"
**Solution:** Ensure your DB user has CREATE TABLE permissions
```bash
# Check user permissions
psql $DATABASE_URL -c "\du"
```

### Issue: "Role does not exist" error
**Solution:** The enum type might already exist. Check:
```bash
psql $DATABASE_URL -c "SELECT * FROM pg_enum WHERE enumlabel='TEACHER';"
```

### Issue: "Index already exists" warning
**Solution:** This is fine - the migration includes `IF NOT EXISTS` clauses

### Issue: Token verification failing
**Solution:** Verify the `verifyToken()` function matches your JWT implementation

### Issue: Course access always returns 403
**Solution:** Check that you have an enrollment record:
```bash
SELECT * FROM enrollments 
WHERE student_id='student-uuid' AND course_id='course-uuid';
```

### Issue: Parent cannot see students
**Solution:** Verify parent-student link exists and is active:
```bash
SELECT * FROM parent_student_links 
WHERE parent_id='parent-uuid' AND is_active=TRUE;
```

---

## 📈 Performance Tuning (Optional)

After deployment, monitor:

```sql
-- Find slow queries
SELECT query, mean_exec_time 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan 
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
```

If needed, add additional indexes:
```sql
-- Course category lookups
CREATE INDEX IF NOT EXISTS idx_courses_category_is_published
ON courses(category_id, is_published) 
WHERE is_published = TRUE;

-- Student progress queries
CREATE INDEX IF NOT EXISTS idx_enrollments_progress_status
ON enrollments(student_id, progress_percentage) 
WHERE status = 'ACTIVE';
```

---

## 🔄 Rollback Procedures

If something goes wrong:

### Option 1: Partial Rollback (Single Phase)
```bash
# Only drop phase 4 tables
psql $DATABASE_URL << EOF
DROP TABLE IF EXISTS parent_student_link_audit CASCADE;
DROP TABLE IF EXISTS parent_student_links CASCADE;
EOF

# Then re-run that phase
npx ts-node scripts/run-migrations.ts
```

### Option 2: Full Rollback (All Phases)
```bash
# Drop all new tables
psql $DATABASE_URL << EOF
DROP TABLE IF EXISTS lesson_progress CASCADE;
DROP TABLE IF EXISTS lesson_attachments CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS invitation_history CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS parent_student_link_audit CASCADE;
DROP TABLE IF EXISTS parent_student_links CASCADE;
DROP TABLE IF EXISTS permission_mappings CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;

-- Remove new columns from users table
ALTER TABLE users DROP COLUMN IF EXISTS gender;
ALTER TABLE users DROP COLUMN IF EXISTS role_changed_at;
ALTER TABLE users DROP COLUMN IF EXISTS role_changed_by;

-- Drop functions
DROP FUNCTION IF EXISTS generate_invitation_token();
DROP FUNCTION IF EXISTS set_invitation_expiry();
DROP FUNCTION IF EXISTS accept_invitation(varchar, uuid);
DROP FUNCTION IF EXISTS get_parent_students(uuid);
DROP FUNCTION IF EXISTS get_student_parents(uuid);
EOF
```

---

## 📝 Deployment Checklist

### Pre-Deployment
- [ ] All migrations run successfully
- [ ] All verification queries pass
- [ ] No errors in migration logs
- [ ] Database backup created
- [ ] Team notified
- [ ] Documentation reviewed

### Deployment
- [ ] Run migrations on production DB
- [ ] Verify all tables created
- [ ] Test critical queries
- [ ] Deploy updated API code
- [ ] Deploy updated types
- [ ] Deploy RBAC middleware

### Post-Deployment
- [ ] Monitor error logs (first hour)
- [ ] Test all major endpoints
- [ ] Verify RBAC enforcement
- [ ] Check performance metrics
- [ ] Document any issues
- [ ] Update runbooks

---

## 🎯 Success Criteria

✅ All migrations complete without errors
✅ 13 new tables created
✅ 18+ indexes created
✅ 6 PL/pgSQL functions created
✅ All API endpoints return correct status codes
✅ RBAC middleware blocks unauthorized access
✅ Course access control works (public vs private)
✅ Invitation lifecycle completes successfully
✅ Parent-student monitoring works
✅ No impact on existing recitations table

---

## 📞 Support & Next Steps

If migrations succeed:
1. ✅ Database schema is complete
2. ✅ API middleware is ready
3. ✅ Type definitions are available
4. ✅ Ready for API endpoint implementation

**Next Phase:** Build API endpoints using templates in `lib/api-endpoint-templates.ts`

For questions, refer to:
- `QUICK_REFERENCE.md` - Quick answers
- `LMS_IMPLEMENTATION_GUIDE.md` - Detailed docs
- `ARCHITECTURE_DIAGRAMS.md` - Visual reference

---

*Deployment Guide | Version 1.0 | Updated: 2024-04-06*
