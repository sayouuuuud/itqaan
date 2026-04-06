# Itqaan LMS Database Schema - Complete Index

## 📚 Documentation Files (Read in This Order)

### 1. **START HERE: QUICK_REFERENCE.md** ⭐
   - **Time:** 5 minutes
   - **For:** Everyone (overview)
   - **Contains:** 
     - TL;DR summary of all 4 phases
     - Key workflows
     - Quick SQL queries
     - FAQ

### 2. **LMS_IMPLEMENTATION_GUIDE.md**
   - **Time:** 30 minutes
   - **For:** Developers building APIs
   - **Contains:**
     - 4-phase architecture
     - Complete schema documentation
     - RBAC rules with examples
     - 5 detailed implementation examples
     - Performance optimizations

### 3. **IMPLEMENTATION_SUMMARY.md**
   - **Time:** 15 minutes
   - **For:** Project leads & reviewers
   - **Contains:**
     - What was delivered
     - Next steps
     - Testing checklist
     - Status & readiness

---

## 🗄️ Database Migration Files

### Execution Order:
```bash
1. scripts/001-phase1-users-roles-expansion.sql
2. scripts/002-phase2-lms-engine-schema.sql
3. scripts/003-phase3-invitation-system.sql
4. scripts/004-phase4-parent-student-relations.sql
```

### Phase Descriptions:

| Phase | File | Tables | Purpose |
|-------|------|--------|---------|
| 1 | `001-*.sql` | `role_permissions`, `permission_mappings` | RBAC infrastructure |
| 2 | `002-*.sql` | `categories`, `courses`, `lessons`, `enrollments` | LMS engine (isolated) |
| 3 | `003-*.sql` | `invitations`, `invitation_history` | User onboarding |
| 4 | `004-*.sql` | `parent_student_links`, `parent_student_link_audit` | Family monitoring |

---

## 🚀 How to Get Started

### Step 1: Run Migrations
```bash
# Option A: Using Node.js
npx ts-node scripts/run-migrations.ts

# Option B: Using psql directly
psql $DATABASE_URL -f scripts/001-phase1-users-roles-expansion.sql
psql $DATABASE_URL -f scripts/002-phase2-lms-engine-schema.sql
psql $DATABASE_URL -f scripts/003-phase3-invitation-system.sql
psql $DATABASE_URL -f scripts/004-phase4-parent-student-relations.sql

# Option C: Using bash script
bash scripts/migrate.sh
```

### Step 2: Verify Installation
```bash
psql $DATABASE_URL -c "\dt" | grep -E "courses|enrollments|invitations"
```

### Step 3: Import Types & Middleware
```typescript
// In your API routes
import type { Course, Enrollment, User } from '@/lib/types/lms'
import { requireRole, checkCourseAccess } from '@/lib/rbac-middleware'
```

### Step 4: Build Endpoints
Use templates from: `lib/api-endpoint-templates.ts`

---

## 📁 Project Structure

```
project-root/
├── scripts/
│   ├── 001-phase1-users-roles-expansion.sql
│   ├── 002-phase2-lms-engine-schema.sql
│   ├── 003-phase3-invitation-system.sql
│   ├── 004-phase4-parent-student-relations.sql
│   ├── SCHEMA_DOCUMENTATION.sql
│   ├── run-migrations.ts
│   ├── migrate.sh
│   └── README (You are here)
│
├── lib/
│   ├── db.ts (existing - uses pg client)
│   ├── types/
│   │   └── lms.ts ⭐ TypeScript types for all entities
│   ├── rbac-middleware.ts ⭐ Role enforcement
│   └── api-endpoint-templates.ts ⭐ Endpoint examples
│
├── QUICK_REFERENCE.md ⭐ Start here
├── LMS_IMPLEMENTATION_GUIDE.md ⭐ Full documentation
├── IMPLEMENTATION_SUMMARY.md ⭐ Delivery summary
└── README.md (index - you are here)
```

---

## 🎯 Core Concepts

### The 4 Phases

```
PHASE 1: Users & Roles
├─ Add gender field (mandatory for new registrations)
├─ Add new roles (TEACHER, PARENT, etc.)
└─ Create RBAC permission system

PHASE 2: LMS Engine (Completely Isolated)
├─ Categories - course categories
├─ Courses - created by teachers
├─ Lessons - video, audio, text content
├─ Enrollments - student progress tracking
└─ Lesson Progress - per-lesson completion

PHASE 3: Invitations
├─ Token-based user onboarding
├─ 7-day expiry (automatic)
├─ Auto-assign roles during registration
└─ Auto-enroll in target courses

PHASE 4: Family Monitoring
├─ Link parents to students
├─ Verify relationships
└─ Track monitoring access
```

### Key Tables

**Users & Roles**
- `users` - Extended with gender field
- `role_permissions` - Role definitions
- `permission_mappings` - Fine-grained permissions

**LMS Core**
- `categories` - Course groupings
- `courses` - Teacher-created courses
- `lessons` - Course content
- `lesson_attachments` - Supplementary materials
- `enrollments` - Student course enrollment
- `lesson_progress` - Lesson completion tracking

**Invitations**
- `invitations` - Token-based onboarding
- `invitation_history` - Audit trail

**Family**
- `parent_student_links` - Family relationships
- `parent_student_link_audit` - Change tracking

---

## 🔐 Role-Based Access Control

### RBAC Rules (Strict Segregation)

```
TEACHER
✅ Create courses
✅ Edit own courses
❌ See other teachers' courses
❌ Access recitations table

READERS_SUPERVISOR
✅ Update READER statuses
❌ Create courses
❌ Access student data

PARENT
✅ View linked students
✅ See course progress
❌ Create content
❌ See unlinked students

STUDENT
✅ Enroll in public courses
✅ View own progress
❌ See other students
❌ Create courses
```

### Course Access Control

```
if course.is_public = TRUE:
  ✅ Everyone can view

else (is_public = FALSE):
  Check enrollment table
  ✅ If enrolled → show
  ❌ If not → 403 Forbidden
```

---

## 💡 Quick Examples

### Example 1: Create a Course (Teacher)
```typescript
const { requireRole } = require('@/lib/rbac-middleware')
const { query } = require('@/lib/db')

export async function POST(req: NextRequest) {
  const { user, response } = await requireRole(req, 'TEACHER')
  if (response) return response
  
  const { title, category_id } = await req.json()
  
  const course = await query(
    `INSERT INTO courses (title, teacher_id, category_id, is_public)
     VALUES ($1, $2, $3, FALSE)
     RETURNING *`,
    [title, user.id, category_id]
  )
  
  return NextResponse.json(course[0])
}
```

### Example 2: Check Course Access
```typescript
const { checkCourseAccess } = require('@/lib/rbac-middleware')

const { canAccess, reason } = await checkCourseAccess(courseId, userId)

if (!canAccess) {
  return NextResponse.json({ error: reason }, { status: 403 })
}
```

### Example 3: Create Invitation
```typescript
const crypto = require('crypto')
const { query } = require('@/lib/db')

const token = 'inv_' + crypto.randomBytes(32).toString('hex')

const inv = await query(
  `INSERT INTO invitations 
   (email, token, role_to_assign, invited_by, expires_at)
   VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days')
   RETURNING *`,
  [email, token, role, adminId]
)
```

### Example 4: Get Parent's Students
```typescript
const { query } = require('@/lib/db')

const students = await query(
  `SELECT u.* FROM parent_student_links psl
   JOIN users u ON psl.student_id = u.id
   WHERE psl.parent_id = $1 AND psl.is_active = TRUE`,
  [parentId]
)
```

---

## 🧪 Verification Queries

```sql
-- Check tables created
SELECT tablename FROM pg_tables 
WHERE tablename LIKE 'courses%' OR tablename LIKE 'invitations%';

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE tablename = 'courses';

-- Test course creation
INSERT INTO courses (title, teacher_id, category_id, is_public)
VALUES ('Test', 'uuid-here', 'uuid-here', false)
RETURNING *;

-- Test invitation
INSERT INTO invitations (email, token, role_to_assign, invited_by, expires_at)
VALUES ('test@example.com', 'inv_test', 'TEACHER', 'admin-uuid', NOW() + INTERVAL '7 days')
RETURNING *;

-- Verify constraints
\d courses
\d enrollments
\d parent_student_links
```

---

## 📊 What's Included

### ✅ SQL Migrations
- 4 complete phases (71, 147, 122, 111 lines respectively)
- Idempotent (safe to run multiple times)
- Strategic indexes on all key queries
- PL/pgSQL functions for complex logic
- Audit trails and trigger functions

### ✅ TypeScript Types
- Full enum definitions
- Interface definitions for all entities
- Composite types for API responses
- Request/response DTOs

### ✅ Middleware & Security
- Role verification
- Permission checking
- Course access control
- Authorization helpers

### ✅ API Templates
- 5+ complete endpoint examples
- All major workflows covered
- Best practices included

### ✅ Documentation
- Quick reference guide
- Comprehensive implementation guide
- Summary of deliverables
- This index file

---

## ❓ Common Questions

**Q: Will this affect the existing recitations flow?**
A: No. All new tables and logic are completely isolated.

**Q: Do I need to run all 4 migrations?**
A: Yes, in order. They're dependent on each other.

**Q: Can I modify the migrations after running them?**
A: It's better to create new migrations for changes (standard practice).

**Q: How do I add new roles?**
A: Add to the `role_permissions` table and update `enum` if using one.

**Q: What if a migration fails?**
A: Check the error message, fix the issue, and re-run. Migrations are idempotent.

**Q: How do I test without running migrations?**
A: You can't - the tables and functions are required for the code to work.

**Q: Where's the API endpoint code?**
A: Templates provided in `lib/api-endpoint-templates.ts` - copy and customize for your needs.

---

## 🚀 Next Immediate Steps

1. **Today:** 
   - Read `QUICK_REFERENCE.md`
   - Run migrations: `npx ts-node scripts/run-migrations.ts`
   - Verify tables exist

2. **This Week:**
   - Read `LMS_IMPLEMENTATION_GUIDE.md`
   - Review `lib/types/lms.ts`
   - Review `lib/rbac-middleware.ts`

3. **Next Week:**
   - Build first endpoint using templates
   - Test RBAC enforcement
   - Implement invitation system

---

## 📞 Documentation Reference

| Need | File |
|------|------|
| Quick overview | `QUICK_REFERENCE.md` |
| Full guide | `LMS_IMPLEMENTATION_GUIDE.md` |
| Status report | `IMPLEMENTATION_SUMMARY.md` |
| SQL details | `scripts/SCHEMA_DOCUMENTATION.sql` |
| TypeScript | `lib/types/lms.ts` |
| Security | `lib/rbac-middleware.ts` |
| Examples | `lib/api-endpoint-templates.ts` |
| Running code | `scripts/run-migrations.ts` |

---

## ✨ Status

```
Database Schema: ✅ COMPLETE
Documentation: ✅ COMPLETE
Type Definitions: ✅ COMPLETE
RBAC Middleware: ✅ COMPLETE
API Templates: ✅ COMPLETE
Migration Scripts: ✅ COMPLETE
Migration Runner: ✅ COMPLETE

Status: ✅ READY FOR IMPLEMENTATION

Next Phase: API Endpoint Development
```

---

**Start reading:** [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

Generated: 2024-04-06 | Schema Version: 1.0 | Database: PostgreSQL 12+
