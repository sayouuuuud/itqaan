# Architecture & Data Model Diagrams

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Itqaan Platform                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Existing System                         │   │
│  │              (Recitations Flow - UNCHANGED)             │   │
│  │                                                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │ Recitations  │  │  Bookings    │  │ Conversations│  │   │
│  │  │   Table      │  │   Table      │  │    Table     │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          NEW LMS/Academy Engine (Phase 1-4)             │   │
│  │              (Completely Isolated)                       │   │
│  │                                                          │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │ Phase 1: Users & Roles (RBAC)                  │   │   │
│  │  │ - role_permissions                             │   │   │
│  │  │ - permission_mappings                          │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │ Phase 2: LMS Engine                            │   │   │
│  │  │ - categories → courses → lessons               │   │   │
│  │  │ - enrollments → lesson_progress                │   │   │
│  │  │ - lesson_attachments                           │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │ Phase 3: Invitation System                     │   │   │
│  │  │ - invitations                                  │   │   │
│  │  │ - invitation_history                           │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │ Phase 4: Family Monitoring                     │   │   │
│  │  │ - parent_student_links                         │   │   │
│  │  │ - parent_student_link_audit                    │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Core Data Model

### Phase 1: Users & Roles

```
┌─────────────────────────┐
│        users            │
├─────────────────────────┤
│ id (PK)                 │
│ name                    │
│ email (UNIQUE)          │
│ password_hash           │
│ role (FK)               │◄──────┐
│ gender (NEW)            │       │
│ role_changed_at (NEW)   │       │
│ role_changed_by (FK)    │       │
│ created_at              │       │
│ updated_at              │       │
└─────────────────────────┘       │
                                   │
                    ┌──────────────┤
                    │              │
        ┌───────────▼──────────┐   │
        │  role_permissions    │   │
        ├──────────────────────┤   │
        │ id (PK)              │   │
        │ role (UNIQUE)  ◄─────┼───┤
        │ description          │   │
        └──────────────────────┘   │
                    │
        ┌───────────▼──────────────┐
        │  permission_mappings     │
        ├──────────────────────────┤
        │ id (PK)                  │
        │ role (FK)                │
        │ resource                 │
        │ action                   │
        │ can_access (Boolean)     │
        └──────────────────────────┘
```

### Phase 2: LMS Engine

```
┌──────────────────┐
│   categories     │
├──────────────────┤
│ id (PK)          │
│ name (UNIQUE)    │
│ description      │
│ created_by (FK)  │
└──────────────────┘
         │
         │ 1:N
         │
         ▼
┌──────────────────────────┐
│      courses             │
├──────────────────────────┤
│ id (PK)                  │
│ title                    │
│ teacher_id (FK users)    │◄─────────┐
│ category_id (FK)         │          │
│ is_public (Boolean)      │          │ N:M
│ is_published             │          │
│ created_at               │          │
└──────────────────────────┘          │
         │                            │
         │ 1:N                        │
         │                      ┌─────▼──────────┐
         ▼                      │  enrollments   │
┌──────────────────────┐       ├────────────────┤
│     lessons          │       │ id (PK)        │
├──────────────────────┤       │ student_id(FK) │
│ id (PK)              │       │ course_id (FK) │
│ course_id (FK)       │       │ progress_%     │
│ title                │       │ status         │
│ video_url            │       │ enrolled_at    │
│ audio_url            │       └────────────────┘
│ lesson_order         │              │
│ is_published         │              │ 1:N
│ created_at           │              │
└──────────────────────┘              │
         │                            │
         │ 1:N                        ▼
         │                    ┌──────────────────┐
         ▼                    │ lesson_progress  │
┌──────────────────────┐     ├──────────────────┤
│ lesson_attachments   │     │ id (PK)          │
├──────────────────────┤     │ enrollment_id(FK)│
│ id (PK)              │     │ lesson_id (FK)   │
│ lesson_id (FK)       │     │ is_completed     │
│ file_url             │     │ watched_seconds  │
│ file_type            │     │ completed_at     │
│ file_name            │     └──────────────────┘
└──────────────────────┘
```

### Phase 3: Invitations

```
┌──────────────────────────────┐
│     invitations              │
├──────────────────────────────┤
│ id (PK)                      │
│ email                        │
│ token (UNIQUE) ◄─────────┐   │
│ role_to_assign               │
│ target_course_id (FK)        │
│ status (Enum)                │
│ expires_at                   │
│ invited_by (FK users)        │
│ accepted_at                  │
│ accepted_by_user_id (FK)     │
└──────────────────────────────┘
         │
         │ 1:N
         │
         ▼
┌──────────────────────────┐
│ invitation_history       │
├──────────────────────────┤
│ id (PK)                  │
│ invitation_id (FK)       │
│ previous_status          │
│ new_status               │
│ changed_by (FK users)    │
│ reason                   │
│ changed_at               │
└──────────────────────────┘

Status Flow:
PENDING ──(accept)──> ACCEPTED
     ├────(expire)───> EXPIRED
     └──(cancel)──> CANCELLED
```

### Phase 4: Family Monitoring

```
┌────────────────────────────────────┐
│  parent_student_links              │
├────────────────────────────────────┤
│ id (PK)                            │
│ parent_id (FK) ─────┐              │
│ student_id (FK) ─┐  │              │
│ relationship_type│  │              │
│ is_active        │  │              │
│ verified         │  │              │
│ verified_at      │  │              │
└────────────────────────────────────┘
     │                    │
     │                    │
     ▼                    ▼
┌──────────────┐    ┌──────────────┐
│ users        │    │ users        │
│ role=PARENT  │    │role=STUDENT  │
└──────────────┘    └──────────────┘
     │
     │ 1:N
     │
     ▼
┌────────────────────────────────┐
│ parent_student_link_audit      │
├────────────────────────────────┤
│ id (PK)                        │
│ parent_student_link_id (FK)    │
│ action (Enum)                  │
│ performed_by (FK users)        │
│ reason                         │
│ created_at                     │
└────────────────────────────────┘
```

---

## 🔄 API Request Flow with RBAC

```
┌─────────────────────┐
│  Client Request     │
│  POST /api/courses  │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────────┐
│ Extract Auth Token       │
│ (Authorization header)   │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────────┐
│ verifyAndGetUser()           │
│ - Verify JWT                 │
│ - Get user from DB           │
│ - Extract role               │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ requireRole('TEACHER')       │
│ - Check user.role === TEACHER│
│ - If not: return 403         │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ checkPermission()            │
│ Query permission_mappings    │
│ - role + resource + action   │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ Business Logic               │
│ INSERT INTO courses          │
│ WITH teacher_id = user.id    │
└──────────┬───────────────────┘
           │
           ▼
┌─────────────────────┐
│ Response 201        │
│ { id, title, ... }  │
└─────────────────────┘
```

---

## 🔐 Role Segregation Matrix

```
                  TEACHER  STUDENT  PARENT  READER_SUP  ADMIN
┌─────────────────────────────────────────────────────────────┐
│ Create Courses    │  ✅   │   ❌   │  ❌   │    ❌     │  ✅ │
│ Edit Own Courses  │  ✅   │   ❌   │  ❌   │    ❌     │  ✅ │
│ Edit Other Course │  ❌   │   ❌   │  ❌   │    ❌     │  ✅ │
│ View All Courses  │  ✅   │   ⚡   │  ✅   │    ✅     │  ✅ │
│ Create Lessons    │  ✅   │   ❌   │  ❌   │    ❌     │  ✅ │
│ Enroll Students   │  ❌   │   ⚡   │  ❌   │    ❌     │  ✅ │
│ View Progress     │  ⚡   │   ✅   │  ✅   │    ❌     │  ✅ │
│ Update Readers    │  ❌   │   ❌   │  ❌   │    ✅     │  ✅ │
│ Manage Invite     │  ❌   │   ❌   │  ❌   │    ❌     │  ✅ │
│ Access Recitations│  ❌   │   ⚡   │  ❌   │    ⚡     │  ✅ │
└─────────────────────────────────────────────────────────────┘

✅ = Full Access
⚡ = Restricted (own data only)
❌ = No Access
```

---

## 🌊 Data Flow: Invitation Lifecycle

```
     ADMIN
      │
      │ Creates Invitation
      ▼
┌─────────────────────┐
│  POST /invitations  │
│ { email, role }     │
└────────┬────────────┘
         │
         ▼
    ┌────────────────────────┐
    │ Generate Token         │
    │ token = 'inv_' + rand  │
    │ expires_at = +7 days   │
    └────────┬───────────────┘
             │
             ▼
    ┌────────────────────────┐
    │ INSERT INTO invitations│
    │ status = 'PENDING'     │
    └────────┬───────────────┘
             │
             ▼
    ┌────────────────────────┐
    │ Send Email             │
    │ Link: /register?token  │
    └────────┬───────────────┘
             │
      USER  │ Clicks Link
      │     │
      └─────┼─────────────────┐
            │                 │
            ▼                 ▼
    ┌──────────────────┐ ┌─────────────────┐
    │ Check Token      │ │ If Expired:     │
    │ Validation       │ │ UPDATE status   │
    │ - Exists?        │ │ = 'EXPIRED'     │
    │ - Not expired?   │ │ Return 400      │
    │ - PENDING?       │ └─────────────────┘
    └────────┬─────────┘
             │ ✅ Valid
             ▼
    ┌──────────────────────────┐
    │ Render Registration Form │
    │ Email pre-filled         │
    └────────┬─────────────────┘
             │
      USER  │ Submits Form
      │     │
      └─────▼────────────────────────┐
            │                        │
            ▼                        ▼
    ┌──────────────────────┐  ┌─────────────────┐
    │ Create User          │  │ Update          │
    │ role = inv.role      │  │ Invitation      │
    │ gender = user input  │  │ status = ACCEPT │
    └────────┬─────────────┘  └─────────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ If target_course_id:     │
    │ Auto-enroll in course    │
    │ INSERT enrollments       │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────────┐
    │ User Now:            │
    │ - Has assigned role  │
    │ - Enrolled (maybe)   │
    │ - Can access system  │
    └──────────────────────┘
```

---

## 📈 Student Progress Tracking

```
STUDENT
   │
   ├─ Enrolls in Course
   │        │
   │        ▼
   │  ┌──────────────────┐
   │  │ enrollments      │
   │  │ progress=0%      │
   │  │ status=ACTIVE    │
   │  │ enrolled_at=now  │
   │  └──────────┬───────┘
   │             │
   │             ├─ For each lesson in course:
   │             │
   │             ▼
   │  ┌──────────────────┐
   │  │ lesson_progress  │
   │  │ is_completed=F   │
   │  │ watched_sec=0    │
   │  └──────────────────┘
   │             │
   │             ├─ Student watches lesson
   │             │
   │             ▼
   │  ┌──────────────────────────┐
   │  │ UPDATE lesson_progress   │
   │  │ watched_sec = +120       │
   │  │ is_in_progress = TRUE    │
   │  └──────────────────────────┘
   │             │
   │             ├─ Student finishes lesson
   │             │
   │             ▼
   │  ┌──────────────────────────┐
   │  │ UPDATE lesson_progress   │
   │  │ is_completed = TRUE      │
   │  │ completed_at = now       │
   │  └──────────────────────────┘
   │             │
   │             └─ (repeat for other lessons)
   │
   └─ Course Complete
          │
          ▼
   ┌────────────────────────┐
   │ UPDATE enrollments:    │
   │ progress = 100%        │
   │ status = COMPLETED     │
   │ completed_at = now     │
   └────────────────────────┘
```

---

## 👨‍👩‍👧 Parent Monitoring Dashboard

```
PARENT Logs In
   │
   ▼
GET /api/parent/students
   │
   ▼
┌──────────────────────────────────────┐
│ SELECT u.* FROM parent_student_links│
│ JOIN users u ON student_id=u.id     │
│ WHERE parent_id = $1                 │
└──────────┬──────────────────────────┘
           │
           ▼
    ┌─────────────────────────┐
    │ For each Student:       │
    │ GET /api/students/:id   │
    │ /enrollments            │
    └──────────┬──────────────┘
               │
               ▼
        ┌────────────────┐
        │ Returns:       │
        │ - Name         │
        │ - Enrollments  │
        │ - Progress %   │
        │ - Status       │
        └────────────────┘

PARENT sees:
┌──────────────────────────────────────┐
│ Student: Ahmed                       │
├──────────────────────────────────────┤
│ Course: Fiqh 101                     │
│ Progress: ████████░░ 80%             │
│ Status: ACTIVE                       │
│ Lessons Completed: 8/10              │
│                                      │
│ Course: Quran Tajweed                │
│ Progress: ██░░░░░░░░ 20%             │
│ Status: ACTIVE                       │
│ Lessons Completed: 2/10              │
└──────────────────────────────────────┘
```

---

## 🔄 Complete System Interaction

```
┌─────────────────────────────────────────────────────────────────┐
│                      HTTP Requests                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Admin: POST /api/invitations                                   │
│         ↓                                                         │
│  Create invitation with token, 7-day expiry                    │
│         ↓                                                         │
│  Teacher: POST /api/courses                                    │
│         ↓                                                         │
│  Create course (teacher_id auto-set)                           │
│         ↓                                                         │
│  Teacher: POST /api/lessons                                    │
│         ↓                                                         │
│  Add lessons to course                                          │
│         ↓                                                         │
│  User: GET /register?token=XYZ                                 │
│         ↓                                                         │
│  Validate token, show registration form                        │
│         ↓                                                         │
│  User: POST /api/auth/register                                 │
│         ↓                                                         │
│  Create user with role, mark invitation ACCEPTED              │
│         ↓                                                         │
│  Student: GET /api/courses (public)                            │
│         ↓                                                         │
│  Browse and enroll in courses                                   │
│         ↓                                                         │
│  Student: GET /api/courses/:id/lessons                         │
│         ↓                                                         │
│  View course content (access control checked)                  │
│         ↓                                                         │
│  Parent: GET /api/parent/students                              │
│         ↓                                                         │
│  Monitor linked students' progress                             │
│         ↓                                                         │
│  RBAC Middleware enforces all permissions                      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Takeaways

1. **Completely Isolated** - New LMS tables don't touch recitations
2. **Strict RBAC** - Teachers can only edit their own courses
3. **Secure Invitations** - Token-based, time-limited
4. **Progress Tracking** - Lesson-level granularity
5. **Family Monitoring** - Parent-student relationships
6. **Access Control** - Public vs private courses
7. **Audit Trails** - All changes logged

---

*Generated: 2024-04-06 | Visual Architecture Guide*
