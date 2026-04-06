# Quick Reference Guide - Itqaan LMS Schema

## 🎯 TL;DR

### What Was Added?

| Phase | What | Tables | Purpose |
|-------|------|--------|---------|
| **1** | Users & Roles | `role_permissions`, `permission_mappings` | RBAC system |
| **2** | LMS Engine | `categories`, `courses`, `lessons`, `enrollments` | Course management |
| **3** | Invitations | `invitations`, `invitation_history` | User onboarding |
| **4** | Family | `parent_student_links`, `parent_student_link_audit` | Parent monitoring |

### Key Tables

```sql
-- Most Important Queries

-- Get teacher's courses
SELECT * FROM courses WHERE teacher_id = $1;

-- Get student's enrolled courses
SELECT c.* FROM courses c
JOIN enrollments e ON c.id = e.course_id
WHERE e.student_id = $1 AND e.status = 'ACTIVE';

-- Check if student can access course
SELECT 1 FROM enrollments 
WHERE student_id = $1 AND course_id = $2;

-- Get parent's students
SELECT u.* FROM parent_student_links psl
JOIN users u ON psl.student_id = u.id
WHERE psl.parent_id = $1 AND psl.is_active = TRUE;

-- Get pending invitations for admin
SELECT * FROM invitations 
WHERE status = 'PENDING' AND expires_at > NOW();
```

## 🔄 Workflows

### Workflow 1: Teacher Creates Course

```
1. Teacher POSTs /api/courses { title, category_id }
   ↓
2. Middleware: Verify user is TEACHER
   ↓
3. INSERT INTO courses (title, teacher_id, category_id, ...)
   └─ teacher_id = authenticated user.id (automatic)
   ↓
4. Return course with id
```

### Workflow 2: Admin Invites User

```
1. Admin POSTs /api/invitations { email, role, target_course_id }
   ↓
2. Generate token: 'inv_' + crypto.randomBytes(32).toString('hex')
   ↓
3. Set expires_at = NOW() + 7 days
   ↓
4. INSERT INTO invitations (...)
   ↓
5. Send email with /register?token=XYZ
```

### Workflow 3: User Accepts Invitation

```
1. User clicks /register?token=XYZ
   ↓
2. SELECT * FROM invitations WHERE token = $1
   ↓
3. Validate: status='PENDING' AND expires_at > NOW()
   ↓
4. User fills registration form
   ↓
5. POST /api/auth/register { name, email, password, token }
   ↓
6. Create user with role = invitation.role_to_assign
   ↓
7. UPDATE invitations SET status='ACCEPTED'
   ↓
8. If target_course_id: INSERT INTO enrollments (...)
```

### Workflow 4: Parent Monitors Student

```
1. Parent logged in
   ↓
2. GET /api/parent/students
   ↓
3. Returns: students linked to parent
   ↓
4. For each student: GET /api/students/:id/enrollments
   ↓
5. Returns: courses student is enrolled in with progress
```

## 🚫 Strict Rules

### TEACHER Cannot:
```javascript
❌ Create courses for other teachers
❌ Edit lessons in other teachers' courses
❌ Access recitations table
❌ Create invitations (admin only)
❌ Manage other users
```

### Access Control:
```javascript
if (course.is_public) {
  ✅ Show to everyone
} else {
  // Check enrollment
  SELECT * FROM enrollments 
  WHERE student_id = $1 AND course_id = $2
  
  ✅ If found: show course
  ❌ If not found: return 403
}
```

## 📊 Data Model Overview

```
users
├─ role (TEACHER, STUDENT, PARENT, etc)
├─ gender (MALE, FEMALE) ← NEW
└─ ... existing fields

courses
├─ teacher_id → users.id ← TEACHER creates
├─ category_id → categories.id
├─ is_public (true=everyone, false=enrolled only)
└─ is_published

lessons
├─ course_id → courses.id
├─ video_url / audio_url
└─ lesson_order

enrollments ← Tracks progress
├─ student_id → users.id
├─ course_id → courses.id
├─ progress_percentage (0-100)
└─ status (ACTIVE, COMPLETED, etc)

parent_student_links ← Family monitoring
├─ parent_id → users(role='PARENT')
├─ student_id → users(role='STUDENT')
└─ relationship_type (FATHER, MOTHER, etc)

invitations ← User onboarding
├─ email
├─ token (unique, random)
├─ role_to_assign
├─ expires_at (7 days)
└─ status (PENDING, ACCEPTED, EXPIRED)
```

## 🔑 Key Indexes (Already Created)

```sql
-- Courses
idx_courses_teacher_id
idx_courses_category_id
idx_courses_is_public

-- Enrollments
idx_enrollments_student_id
idx_enrollments_course_id

-- Invitations
idx_invitations_token
idx_invitations_email

-- Parent-Student
idx_parent_student_links_parent_id
```

## 🛠️ Common API Operations

### Create Course (Teacher Only)
```typescript
await requireRole(req, 'TEACHER')
await query(
  `INSERT INTO courses (title, teacher_id, category_id) 
   VALUES ($1, $2, $3)`,
  [title, user.id, category_id]
)
```

### Get Student's Courses
```typescript
await query(
  `SELECT c.* FROM courses c
   JOIN enrollments e ON c.id = e.course_id
   WHERE e.student_id = $1`,
  [student_id]
)
```

### Check Course Access
```typescript
const { canAccess } = await checkCourseAccess(courseId, userId)
if (!canAccess) return NextResponse.json({}, { status: 403 })
```

### Create Invitation
```typescript
const token = 'inv_' + crypto.randomBytes(32).toString('hex')
await query(
  `INSERT INTO invitations 
   (email, token, role_to_assign, expires_at, invited_by)
   VALUES ($1, $2, $3, NOW() + INTERVAL '7 days', $4)`,
  [email, token, role, admin_id]
)
```

### Validate Invitation
```typescript
const inv = await queryOne(
  `SELECT * FROM invitations WHERE token = $1 AND status = 'PENDING'`,
  [token]
)
if (inv.expires_at < new Date()) throw new Error('Expired')
```

### Accept Invitation
```typescript
await query(
  `UPDATE invitations SET status = 'ACCEPTED', accepted_by_user_id = $1
   WHERE id = $2`,
  [user_id, invitation_id]
)
if (invitation.target_course_id) {
  await query(
    `INSERT INTO enrollments (student_id, course_id)
     VALUES ($1, $2)`,
    [user_id, invitation.target_course_id]
  )
}
```

## 📁 Files Created

| File | Purpose |
|------|---------|
| `scripts/001-phase1-*.sql` | User roles expansion |
| `scripts/002-phase2-*.sql` | LMS tables |
| `scripts/003-phase3-*.sql` | Invitation system |
| `scripts/004-phase4-*.sql` | Parent-student links |
| `scripts/run-migrations.ts` | Node.js migration runner |
| `lib/types/lms.ts` | TypeScript types |
| `lib/rbac-middleware.ts` | Role enforcement |
| `lib/api-endpoint-templates.ts` | Endpoint examples |
| `LMS_IMPLEMENTATION_GUIDE.md` | Full documentation |

## ⚡ Quick Start

```bash
# 1. Run migrations
npx ts-node scripts/run-migrations.ts

# 2. Check migrations succeeded
psql $DATABASE_URL -c "\dt" | grep -E "courses|enrollments|invitations|parent_student"

# 3. Import types in your API routes
import type { Course, Enrollment, User } from '@/lib/types/lms'

# 4. Use RBAC middleware
import { requireRole, checkCourseAccess } from '@/lib/rbac-middleware'

# 5. Build your endpoints following templates in lib/api-endpoint-templates.ts
```

## ❓ FAQ

**Q: Can a TEACHER see other teachers' courses?**
A: No. Queries automatically filter by `teacher_id = current_user.id`

**Q: Can anyone see a private course?**
A: Only if they have an enrollment record in the enrollments table

**Q: What happens if invitation expires?**
A: Status changes to EXPIRED and it cannot be consumed

**Q: Can a parent create courses?**
A: No. PARENT role can only read student data

**Q: Is recitations affected?**
A: No. All new tables are completely separate

---

**Last Updated:** 2024-04-06
**Schema Version:** 1.0
**Ready for:** API endpoint implementation
