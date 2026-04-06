-- Complete Database Schema Documentation
-- Itqaan LMS/Academy Engine - Phase 1-4
-- Database: PostgreSQL 12+

/*
================================================================================
PHASE 1: USERS & ROLES EXPANSION
================================================================================

This phase expands the existing users table to support the new LMS structure and
adds comprehensive role-based access control infrastructure.

NEW FIELD IN USERS TABLE:
- gender (VARCHAR(10)) - MALE or FEMALE, mandatory for new registrations

NEW ROLES (added to user_role enum):
- TEACHER: Creates and manages courses and lessons
- PARENT: Monitors student progress
- READERS_SUPERVISOR: Manages reader status updates
- READERS_MONITOR: Tracks reader activities
- FIQH_ADMIN: Manages Fiqh questions
- CONTENT_SUPERVISOR: Supervises educational content

TABLES CREATED:
- role_permissions: Stores role definitions and descriptions
- permission_mappings: Fine-grained permission matrix for each role

================================================================================
PHASE 2: LMS ENGINE SCHEMA
================================================================================

This phase creates a completely isolated set of tables for the educational
content management system. INDEPENDENT from the existing recitations table.

TABLES:

1. CATEGORIES
   - Stores course categories (Fiqh, Aqeedah, Tajweed, etc.)
   - Fields: id, name (UNIQUE), description, slug, icon_url, display_order, 
     is_active, created_at, updated_at, created_by

2. COURSES (السلاسل)
   - Stores courses created by teachers
   - Fields: id, title, slug (UNIQUE), description, teacher_id (FK->users), 
     category_id (FK->categories), is_public, is_published, thumbnail_url, 
     duration_minutes, difficulty_level, language, total_lessons, 
     created_at, updated_at

3. LESSONS
   - Individual lessons within courses
   - Fields: id, course_id (FK->courses), title, description, video_url, 
     audio_url, transcript_text, lesson_order, duration_minutes, is_published, 
     created_at, updated_at

4. LESSON_ATTACHMENTS
   - Supplementary materials (PDFs, docs, etc.) for lessons
   - Fields: id, lesson_id (FK->lessons), file_url, file_type (PDF/DOC/DOCX/etc), 
     file_name, file_size_bytes, display_order, created_at, updated_at

5. ENROLLMENTS (اشتراكات الطلاب)
   - Tracks student enrollment and progress in courses
   - Fields: id, student_id (FK->users), course_id (FK->courses), 
     progress_percentage, last_accessed_at, completed_at, status 
     (ACTIVE/PAUSED/COMPLETED/DROPPED), enrolled_at, updated_at
   - UNIQUE: (student_id, course_id)

6. LESSON_PROGRESS
   - Tracks completion status of individual lessons per enrollment
   - Fields: id, enrollment_id (FK->enrollments), lesson_id (FK->lessons), 
     is_completed, is_in_progress, watched_duration_seconds, started_at, 
     completed_at, created_at, updated_at
   - UNIQUE: (enrollment_id, lesson_id)

================================================================================
PHASE 3: INVITATION SYSTEM
================================================================================

Token-based invitation system for onboarding users into specific roles or courses.

TABLES:

1. INVITATIONS
   - Stores invitation records
   - Fields: id, email, token (UNIQUE), role_to_assign, target_course_id 
     (FK->courses, nullable), status (PENDING/ACCEPTED/EXPIRED/CANCELLED), 
     expires_at, invited_by (FK->users), accepted_at, accepted_by_user_id 
     (FK->users), created_at, updated_at

2. INVITATION_HISTORY
   - Audit trail of invitation status changes
   - Fields: id, invitation_id (FK->invitations), previous_status, new_status, 
     changed_by (FK->users), reason, changed_at

FUNCTIONS:
- generate_invitation_token(): Creates a unique token for invitations
- set_invitation_expiry(): Auto-sets expiry to 7 days if not specified
- accept_invitation(token, user_id): Validates and accepts an invitation

WORKFLOW:
1. Admin creates invitation with email and role
2. System generates unique token, sets 7-day expiry, sends email with link
3. User clicks link /register?token=XYZ
4. Backend validates token exists, status=PENDING, not expired
5. User creates account
6. System auto-assigns role, updates status to ACCEPTED, auto-enrolls if course

================================================================================
PHASE 4: PARENT-STUDENT RELATIONS
================================================================================

Links parents to students for monitoring and notifications.

TABLES:

1. PARENT_STUDENT_LINKS
   - Establishes parent-student relationships
   - Fields: id, parent_id (FK->users WHERE role='PARENT'), 
     student_id (FK->users WHERE role='STUDENT'), relationship_type 
     (FATHER/MOTHER/GUARDIAN/OTHER), is_active, verified, verified_at, 
     created_at, updated_at
   - UNIQUE: (parent_id, student_id)
   - CONSTRAINTS: Enforces role checks via CHECK constraints

2. PARENT_STUDENT_LINK_AUDIT
   - Audit trail for relationship changes
   - Fields: id, parent_student_link_id (FK->parent_student_links), 
     action (CREATED/VERIFIED/UNLINKED/etc), performed_by (FK->users), 
     reason, created_at

FUNCTIONS:
- get_parent_students(parent_id): Returns all students linked to a parent
- get_student_parents(student_id): Returns all parents linked to a student

================================================================================
SECURITY CONSIDERATIONS
================================================================================

1. ROLE-BASED ACCESS CONTROL (RBAC):
   - TEACHER: Can ONLY create/edit courses linked to their teacher_id
   - READERS_SUPERVISOR: Can update reader statuses only, NO course creation
   - PARENT: Read-only access to linked students' progress
   - All access should be enforced at API middleware level

2. COURSE ACCESS CONTROL:
   - If is_public = TRUE: Anyone can view
   - If is_public = FALSE: Only check if requesting user in Enrollments table
   - Return 403 Forbidden if unauthorized

3. INVITATION SECURITY:
   - Tokens are unique and cryptographically random
   - Tokens expire after 7 days
   - Status transitions are tracked in audit table
   - Only PENDING invitations can be accepted

4. DATA INTEGRITY:
   - Foreign keys prevent orphaned records
   - CHECK constraints enforce role validity
   - Unique constraints prevent duplicates
   - Cascading deletes maintain referential integrity

================================================================================
INDEXES FOR PERFORMANCE
================================================================================

Strategic indexes are created for:
- Role and gender lookups (users)
- Teacher and category course lookups
- Course publication and public status
- Student enrollments and progress
- Fast token and email lookups for invitations
- Parent-student relationship queries

================================================================================
IMPORTANT: DO NOT MODIFY THE RECITATIONS FLOW
================================================================================

These new tables are COMPLETELY ISOLATED from the existing recitations table.
The existing recitation review workflow remains unchanged and functional.

*/

-- To run all migrations in order:
-- 1. psql -U user -d database -f 001-phase1-users-roles-expansion.sql
-- 2. psql -U user -d database -f 002-phase2-lms-engine-schema.sql
-- 3. psql -U user -d database -f 003-phase3-invitation-system.sql
-- 4. psql -U user -d database -f 004-phase4-parent-student-relations.sql
