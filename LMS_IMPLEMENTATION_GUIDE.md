# Itqaan LMS/Academy Engine - Database Schema & Implementation Guide

## 📋 Overview

This document describes Phase 1-4 of the Itqaan platform expansion: implementing a complete LMS (Learning Management System) and Academy Engine alongside the existing Recitations system.

**Key Constraint:** The existing recitations flow remains **completely unchanged**. All new tables and logic are isolated in a separate schema layer.

---

## 🏗️ Architecture

### Four Phases of Implementation

```
Phase 1: Users & Roles Expansion
  └─ Add gender field to users
  └─ Expand role enum with new roles
  └─ Create RBAC permission system

Phase 2: LMS Engine (Isolated)
  └─ Categories, Courses, Lessons
  └─ Enrollments & Student Progress
  └─ Lesson Attachments

Phase 3: Invitation System
  └─ Token-based user onboarding
  └─ Role assignment during registration
  └─ Auto-enrollment in target courses

Phase 4: Parent-Student Relations
  └─ Link parents to students
  └─ Family monitoring capabilities
  └─ Relationship tracking & audits
```

---

## 🗄️ Database Schema

### Phase 1: Users & Roles

#### Fields Added to `users` Table
- `gender` (VARCHAR) - MALE or FEMALE - **Mandatory for new registrations**
- `role_changed_at` (TIMESTAMP) - Track when role changed
- `role_changed_by` (UUID FK) - Who changed the role

#### New User Roles
```
ADMIN                  - System administrator
TEACHER               - Creates courses and lessons
STUDENT               - Enrolls in courses (existing)
READER                - Reviews recitations (existing)
PARENT                - Monitors student progress
READERS_SUPERVISOR    - Manages reader statuses
READERS_MONITOR       - Tracks reader activities
FIQH_ADMIN            - Manages Fiqh questions
CONTENT_SUPERVISOR    - Supervises content
```

#### New Tables
- **role_permissions** - Role definitions and descriptions
- **permission_mappings** - Fine-grained permission matrix

### Phase 2: LMS Engine

```
CATEGORIES
├── id (PK)
├── name (UNIQUE)
├── description
├── slug
├── is_active
└── created_by (FK users)

COURSES
├── id (PK)
├── title
├── teacher_id (FK users) ◄── TEACHER creates courses
├── category_id (FK categories)
├── is_public (Boolean)
├── is_published
├── difficulty_level
└── [metadata]

LESSONS
├── id (PK)
├── course_id (FK courses)
├── title
├── video_url / audio_url
├── lesson_order
├── is_published
└── [metadata]

LESSON_ATTACHMENTS
├── id (PK)
├── lesson_id (FK lessons)
├── file_url
├── file_type (PDF, DOC, etc)
└── [metadata]

ENROLLMENTS ◄── Tracks student progress
├── id (PK)
├── student_id (FK users)
├── course_id (FK courses)
├── progress_percentage
├── status (ACTIVE, COMPLETED, etc)
└── [timestamps]

LESSON_PROGRESS
├── id (PK)
├── enrollment_id (FK enrollments)
├── lesson_id (FK lessons)
├── is_completed
├── watched_duration_seconds
└── [timestamps]
```

### Phase 3: Invitation System

```
INVITATIONS
├── id (PK)
├── email
├── token (UNIQUE) ◄── Secure, random token
├── role_to_assign
├── target_course_id (FK courses, nullable)
├── status (PENDING → ACCEPTED → EXPIRED)
├── expires_at (7 days default)
├── invited_by (FK users)
└── [tracking]

INVITATION_HISTORY
├── id (PK)
├── invitation_id (FK invitations)
├── previous_status
├── new_status
├── changed_by (FK users)
└── reason
```

**Invitation Lifecycle:**
1. Admin creates invitation → token generated, 7-day expiry set
2. System sends email with `/register?token=XYZ`
3. User clicks link → validates token (not expired, PENDING)
4. User registers → role auto-assigned, status → ACCEPTED
5. If `target_course_id` exists → auto-enroll in course

### Phase 4: Parent-Student Relations

```
PARENT_STUDENT_LINKS
├── id (PK)
├── parent_id (FK users WHERE role='PARENT')
├── student_id (FK users WHERE role='STUDENT')
├── relationship_type (FATHER, MOTHER, GUARDIAN, OTHER)
├── is_active
├── verified
└── [timestamps]

PARENT_STUDENT_LINK_AUDIT
├── id (PK)
├── parent_student_link_id (FK)
├── action (CREATED, VERIFIED, UNLINKED, etc)
├── performed_by (FK users)
└── reason
```

---

## 🔐 Role-Based Access Control (RBAC)

### Strict Segregation Rules

#### TEACHER Role
```javascript
// ✅ CAN:
- Create courses
- Edit lessons in their own courses
- Update course metadata
- Add attachments to their lessons

// ❌ CANNOT:
- Create courses for other teachers
- Access other teachers' courses
- Touch recitations table
- Manage users or roles
- Create invitations (admin only)
```

#### READERS_SUPERVISOR Role
```javascript
// ✅ CAN:
- View all READER users
- Update READER status (Pending → Active, etc)
- Monitor reader performance

// ❌ CANNOT:
- Create courses
- Access student data
- Manage non-READER users
```

#### PARENT Role
```javascript
// ✅ CAN:
- View linked students' profiles
- See enrolled courses
- Monitor progress percentage
- View lesson completion status

// ❌ CANNOT:
- Create or edit courses
- Access non-linked students
- Update student data
```

#### STUDENT Role
```javascript
// ✅ CAN:
- Enroll in public courses
- View enrolled course content
- Track their progress
- Access lessons and attachments

// ❌ CANNOT:
- Create courses
- Modify course content
- View other students' data
```

### Course Access Control

```javascript
// GET /api/courses/:courseId
if (course.is_public === true) {
  // Anyone can view
  return course
} else if (course.is_public === false) {
  // Check enrollment
  const enrollment = await db.query(
    'SELECT * FROM enrollments WHERE student_id=$1 AND course_id=$2',
    [userId, courseId]
  )
  if (enrollment) return course
  else return 403 Forbidden
}
```

---

## 🚀 Getting Started

### 1. Run Migrations

```bash
# Using Node.js
npx ts-node scripts/run-migrations.ts

# Or using psql directly
psql $DATABASE_URL -f scripts/001-phase1-users-roles-expansion.sql
psql $DATABASE_URL -f scripts/002-phase2-lms-engine-schema.sql
psql $DATABASE_URL -f scripts/003-phase3-invitation-system.sql
psql $DATABASE_URL -f scripts/004-phase4-parent-student-relations.sql
```

### 2. Database Connection

The project uses PostgreSQL with `pg` client:

```typescript
// lib/db.ts
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  const result = await pool.query(text, params)
  return result.rows as T[]
}
```

### 3. Import Type Definitions

```typescript
// Your API routes
import type {
  User,
  Course,
  Lesson,
  Enrollment,
  Invitation,
  ParentStudentLink,
  UserRole,
} from '@/lib/types/lms'
```

### 4. Use RBAC Middleware

```typescript
// example API route: /api/courses (CREATE)
import { requireRole, checkCourseAccess, forbidden } from '@/lib/rbac-middleware'

export async function POST(req: NextRequest) {
  // Verify user is TEACHER
  const { user, response } = await requireRole(req, 'TEACHER')
  if (response) return response
  
  // Teacher can only create courses for themselves
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

---

## 📝 Implementation Examples

### Example 1: Create a Course (Teacher)

```typescript
// POST /api/courses
const { title, description, category_id } = await req.json()

const course = await query(
  `INSERT INTO courses 
   (title, description, teacher_id, category_id, is_public)
   VALUES ($1, $2, $3, $4, FALSE)
   RETURNING *`,
  [title, description, teacher.id, category_id]
)

// Returns: { id, title, teacher_id, category_id, ... }
```

### Example 2: Create an Invitation (Admin)

```typescript
// POST /api/invitations
const { email, role_to_assign, target_course_id } = await req.json()

const token = 'inv_' + crypto.randomBytes(32).toString('hex')

const invitation = await query(
  `INSERT INTO invitations 
   (email, token, role_to_assign, target_course_id, invited_by, expires_at)
   VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '7 days')
   RETURNING *`,
  [email, token, role_to_assign, target_course_id || null, adminUser.id]
)

// Email sent with: /register?token=inv_xyz...
```

### Example 3: Accept Invitation (During Registration)

```typescript
// POST /api/auth/register
const { name, email, password, token } = await req.json()

// Validate invitation
const invitation = await queryOne(
  `SELECT * FROM invitations WHERE token=$1 AND status='PENDING'`,
  [token]
)

if (!invitation || invitation.expires_at < new Date()) {
  throw new Error('Invalid or expired invitation')
}

// Create user
const user = await query(
  `INSERT INTO users (name, email, password_hash, role, gender, email_verified)
   VALUES ($1, $2, $3, $4, $5, TRUE)
   RETURNING *`,
  [name, email, hashedPassword, invitation.role_to_assign, 'MALE']
)

// Mark invitation as accepted
await query(
  `UPDATE invitations SET status='ACCEPTED', accepted_by_user_id=$1 
   WHERE id=$2`,
  [user.id, invitation.id]
)

// Auto-enroll in target course if exists
if (invitation.target_course_id) {
  await query(
    `INSERT INTO enrollments (student_id, course_id) VALUES ($1, $2)`,
    [user.id, invitation.target_course_id]
  )
}
```

### Example 4: Get Course with Access Control

```typescript
// GET /api/courses/:courseId
const { canAccess, reason } = await checkCourseAccess(courseId, userId)

if (!canAccess) {
  return NextResponse.json({ error: reason }, { status: 403 })
}

const course = await queryOne(
  `SELECT * FROM courses WHERE id=$1`,
  [courseId]
)

const lessons = await query(
  `SELECT * FROM lessons WHERE course_id=$1 ORDER BY lesson_order`,
  [courseId]
)

return NextResponse.json({ ...course, lessons })
```

### Example 5: Parent Monitoring

```typescript
// GET /api/parent/students/:parentId
const students = await query(
  `SELECT u.* FROM parent_student_links psl
   JOIN users u ON psl.student_id = u.id
   WHERE psl.parent_id=$1 AND psl.is_active=TRUE`,
  [parentId]
)

// For each student, get enrollments
for (const student of students) {
  const enrollments = await query(
    `SELECT e.*, c.title FROM enrollments e
     JOIN courses c ON e.course_id = c.id
     WHERE e.student_id=$1`,
    [student.id]
  )
  student.courses = enrollments
}
```

---

## 📊 Performance Optimizations

All critical queries have indexes:

```sql
-- Course lookups
CREATE INDEX idx_courses_teacher_id ON courses(teacher_id)
CREATE INDEX idx_courses_category_id ON courses(category_id)
CREATE INDEX idx_courses_is_public ON courses(is_public)

-- Enrollment queries
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id)
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id)

-- Invitation lookups
CREATE INDEX idx_invitations_token ON invitations(token)
CREATE INDEX idx_invitations_email ON invitations(email)

-- Parent-student relations
CREATE INDEX idx_parent_student_links_parent_id ON parent_student_links(parent_id)
```

---

## 🔒 Security Considerations

1. **Always use parameterized queries** to prevent SQL injection
2. **Enforce roles at API middleware level** - never trust client roles
3. **Validate invitations** - check token, status, and expiry
4. **Use bcrypt** for password hashing
5. **Check course access** before returning lesson content
6. **Audit trail** - log all role changes and permission modifications
7. **Parent-student links** - verify relationship before exposing data

---

## 📚 File Structure

```
/scripts/
  ├── 001-phase1-users-roles-expansion.sql
  ├── 002-phase2-lms-engine-schema.sql
  ├── 003-phase3-invitation-system.sql
  ├── 004-phase4-parent-student-relations.sql
  ├── run-migrations.ts
  ├── migrate.sh
  └── SCHEMA_DOCUMENTATION.sql

/lib/
  ├── db.ts (existing connection pool)
  ├── types/
  │   └── lms.ts (new type definitions)
  ├── rbac-middleware.ts (new role enforcement)
  └── api-endpoint-templates.ts (new endpoint examples)
```

---

## ⚠️ Important Notes

1. **DO NOT modify existing recitations flow** - All new functionality is isolated
2. **Database connection** uses `pg` client with connection pooling
3. **Async/await patterns** throughout - no blocking operations
4. **Type safety** - All database queries are TypeScript typed
5. **Migrations are idempotent** - Safe to run multiple times

---

## 🚫 What's NOT Included Yet

These require API endpoint implementation:

- [ ] Invitation creation endpoint
- [ ] Invitation consumption during registration
- [ ] Course CRUD endpoints
- [ ] Lesson management endpoints
- [ ] Enrollment endpoints
- [ ] Progress tracking endpoints
- [ ] Parent monitoring endpoints
- [ ] Reader status update endpoints

Each needs:
- RBAC middleware checks
- Input validation with Zod
- Error handling
- Audit logging

---

## 📞 Support

For questions about:
- **Schema design** - See `SCHEMA_DOCUMENTATION.sql`
- **Type definitions** - See `lib/types/lms.ts`
- **RBAC logic** - See `lib/rbac-middleware.ts`
- **API patterns** - See `lib/api-endpoint-templates.ts`

---

**Status:** ✅ Schema complete, ready for API implementation
