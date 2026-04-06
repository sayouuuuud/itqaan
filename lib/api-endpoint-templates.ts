/**
 * API Endpoint Templates for LMS/Academy Engine
 * 
 * These are starter templates for implementing the business logic scenarios.
 * Copy these patterns to create your actual endpoints.
 */

// ============================================================================
// SCENARIO 1: INVITATION LIFECYCLE
// ============================================================================

/*
Endpoint: POST /api/invitations/create
Description: Admin creates an invitation for a user to join as a specific role

Flow:
1. Verify requester is ADMIN
2. Generate unique token
3. Set expires_at to 7 days from now
4. Save to DB
5. Send mock email with registration link

Example Request:
{
  "email": "test@email.com",
  "role_to_assign": "TEACHER",
  "target_course_id": null
}

Example Response:
{
  "success": true,
  "invitation": {
    "id": "uuid",
    "token": "inv_xyz...",
    "email": "test@email.com",
    "role_to_assign": "TEACHER",
    "expires_at": "2024-04-13T12:00:00Z"
  }
}
*/

export const createInvitationEndpointTemplate = `
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireRole, serverError } from '@/lib/rbac-middleware'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { user, response: authResponse } = await requireRole(req, 'ADMIN')
    if (authResponse) return authResponse

    const { email, role_to_assign, target_course_id } = await req.json()

    // Validate input
    if (!email || !role_to_assign) {
      return NextResponse.json(
        { error: 'Email and role_to_assign are required' },
        { status: 400 }
      )
    }

    // Generate unique token
    const token = 'inv_' + crypto.randomBytes(32).toString('hex')

    // Insert invitation
    const invitation = await query(
      \`INSERT INTO invitations 
       (email, token, role_to_assign, target_course_id, invited_by, expires_at)
       VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '7 days')
       RETURNING *\`,
      [email, token, role_to_assign, target_course_id || null, user.id]
    )

    // TODO: Send email with registration link
    // await sendInvitationEmail(email, token, role_to_assign)

    return NextResponse.json({ success: true, invitation: invitation[0] })
  } catch (error) {
    return serverError()
  }
}
`

/*
Endpoint: GET /api/auth/register?token=XYZ
Description: Validate invitation token and redirect to registration form

Flow:
1. Check if token exists
2. Verify status == PENDING
3. Verify not expired
4. Return invitation details for form pre-population

Example Response:
{
  "valid": true,
  "email": "test@email.com",
  "role": "TEACHER",
  "message": "Ready to register"
}
*/

export const validateInvitationTokenTemplate = `
import { query } from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token) {
    return new Response(
      JSON.stringify({ valid: false, error: 'No token provided' }),
      { status: 400 }
    )
  }

  const invitation = await query(
    \`SELECT email, role_to_assign, expires_at, status 
     FROM invitations WHERE token = $1\`,
    [token]
  )

  if (!invitation.length) {
    return new Response(
      JSON.stringify({ valid: false, error: 'Invalid token' }),
      { status: 404 }
    )
  }

  const inv = invitation[0]

  if (inv.status !== 'PENDING') {
    return new Response(
      JSON.stringify({ valid: false, error: 'Invitation already used or cancelled' }),
      { status: 400 }
    )
  }

  if (new Date(inv.expires_at) < new Date()) {
    // Update status to EXPIRED
    await query(
      'UPDATE invitations SET status = \\'EXPIRED\\' WHERE token = $1',
      [token]
    )
    return new Response(
      JSON.stringify({ valid: false, error: 'Invitation has expired' }),
      { status: 400 }
    )
  }

  return new Response(
    JSON.stringify({
      valid: true,
      email: inv.email,
      role: inv.role_to_assign,
    })
  )
}
`

// ============================================================================
// SCENARIO 2: COURSE ACCESS CONTROL
// ============================================================================

/*
Endpoint: GET /api/courses/:courseId
Description: Fetch course with access control

Rules:
- If is_public = TRUE: Anyone can view
- If is_public = FALSE: Only enrolled students
- Return 403 Forbidden if unauthorized

Example Response:
{
  "id": "uuid",
  "title": "Fiqh 101",
  "description": "...",
  "teacher_id": "uuid",
  "is_public": false,
  "lessons": [...]
}
*/

export const getCourseWithAccessControlTemplate = `
import { query } from '@/lib/db'
import { checkCourseAccess, forbidden, notFound } from '@/lib/rbac-middleware'

export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  const userId = req.headers.get('X-User-Id') // From your auth middleware

  // Check access
  const { canAccess, reason } = await checkCourseAccess(params.courseId, userId!)
  
  if (!canAccess) {
    return forbidden(reason)
  }

  // Fetch course
  const courses = await query(
    \`SELECT * FROM courses WHERE id = $1\`,
    [params.courseId]
  )

  if (!courses.length) {
    return notFound('Course not found')
  }

  // Fetch lessons
  const lessons = await query(
    \`SELECT * FROM lessons WHERE course_id = $1 ORDER BY lesson_order\`,
    [params.courseId]
  )

  return NextResponse.json({
    ...courses[0],
    lessons,
  })
}
`

// ============================================================================
// SCENARIO 3: TEACHER ROLE SEGREGATION
// ============================================================================

/*
Endpoint: POST /api/courses
Description: Create a course (TEACHER only)

Requirements:
- User must have TEACHER role
- Course is automatically linked to their teacher_id
- Cannot specify a different teacher_id

Example Request:
{
  "title": "Fiqh 101",
  "description": "...",
  "category_id": "uuid",
  "is_public": false
}

Example Response:
{
  "id": "uuid",
  "title": "Fiqh 101",
  "teacher_id": "teacher-uuid",
  "created_at": "2024-04-06T..."
}
*/

export const createCourseTemplate = `
import { requireRole, serverError } from '@/lib/rbac-middleware'

export async function POST(req: NextRequest) {
  try {
    const { user, response: authResponse } = await requireRole(req, 'TEACHER')
    if (authResponse) return authResponse

    const { title, description, category_id, is_public } = await req.json()

    // Validate
    if (!title || !category_id) {
      return NextResponse.json(
        { error: 'Title and category_id are required' },
        { status: 400 }
      )
    }

    // Create course with teacher_id automatically set to current user
    const course = await query(
      \`INSERT INTO courses 
       (title, description, teacher_id, category_id, is_public)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *\`,
      [title, description || null, user.id, category_id, is_public || false]
    )

    return NextResponse.json(course[0], { status: 201 })
  } catch (error) {
    return serverError()
  }
}
`

/*
Endpoint: GET /api/teacher/courses
Description: Get all courses created by the current teacher

- Returns only courses where teacher_id = current user
- Cannot access other teachers' courses
*/

export const getTeacherCoursesTemplate = `
import { requireRole, serverError } from '@/lib/rbac-middleware'

export async function GET(req: NextRequest) {
  try {
    const { user, response: authResponse } = await requireRole(req, 'TEACHER')
    if (authResponse) return authResponse

    const courses = await query(
      \`SELECT * FROM courses WHERE teacher_id = $1 ORDER BY created_at DESC\`,
      [user.id]
    )

    return NextResponse.json(courses)
  } catch (error) {
    return serverError()
  }
}
`

// ============================================================================
// SCENARIO 4: PARENT MONITORING
// ============================================================================

/*
Endpoint: GET /api/parent/students
Description: Get all students linked to a parent

- Returns only students where parent_id = current user
- Includes enrollment and progress data
*/

export const getParentStudentsTemplate = `
import { requireRole, serverError } from '@/lib/rbac-middleware'

export async function GET(req: NextRequest) {
  try {
    const { user, response: authResponse } = await requireRole(req, 'PARENT')
    if (authResponse) return authResponse

    const students = await query(
      \`SELECT u.*, psl.relationship_type 
       FROM parent_student_links psl
       JOIN users u ON psl.student_id = u.id
       WHERE psl.parent_id = $1 AND psl.is_active = TRUE
       ORDER BY psl.created_at DESC\`,
      [user.id]
    )

    // For each student, get their enrollments and progress
    for (const student of students) {
      const enrollments = await query(
        \`SELECT e.*, c.title as course_title
         FROM enrollments e
         JOIN courses c ON e.course_id = c.id
         WHERE e.student_id = $1\`,
        [student.id]
      )
      student.enrollments = enrollments
    }

    return NextResponse.json(students)
  } catch (error) {
    return serverError()
  }
}
`

// ============================================================================
// SCENARIO 5: READERS_SUPERVISOR ROLE
// ============================================================================

/*
Endpoint: PATCH /api/readers/:readerId/status
Description: Update reader status

- Only READERS_SUPERVISOR can call this
- Can only update users with READER role
- Common transitions: Pending → Active, Active → Inactive
*/

export const updateReaderStatusTemplate = `
import { requireRole, isReadersSupervisorAuthorized, forbidden } from '@/lib/rbac-middleware'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { readerId: string } }
) {
  try {
    const { user, response: authResponse } = await requireRole(req, 'READERS_SUPERVISOR')
    if (authResponse) return authResponse

    // Verify target is actually a READER
    const authorized = await isReadersSupervisorAuthorized(user.id, params.readerId)
    if (!authorized) {
      return forbidden('Can only update READER users')
    }

    const { status } = await req.json()

    // Update reader status
    const updated = await query(
      \`UPDATE users SET status = $1 WHERE id = $2 RETURNING *\`,
      [status, params.readerId]
    )

    return NextResponse.json(updated[0])
  } catch (error) {
    return serverError()
  }
}
`
