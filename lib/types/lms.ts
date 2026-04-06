// TypeScript Type Definitions for LMS Schema
// Auto-sync with database schema changes

/**
 * PHASE 1: Users & Roles
 */

export enum UserRole {
  ADMIN = 'ADMIN',
  STUDENT = 'STUDENT',
  READER = 'READER',
  TEACHER = 'TEACHER',
  PARENT = 'PARENT',
  READERS_SUPERVISOR = 'READERS_SUPERVISOR',
  READERS_MONITOR = 'READERS_MONITOR',
  FIQH_ADMIN = 'FIQH_ADMIN',
  CONTENT_SUPERVISOR = 'CONTENT_SUPERVISOR',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export interface User {
  id: string
  name: string
  email: string
  password_hash?: string
  role: UserRole
  gender?: Gender
  verification_code?: string
  verification_expires_at?: Date
  email_verified: boolean
  created_at: Date
  updated_at: Date
  role_changed_at?: Date
  role_changed_by?: string
}

export interface RolePermission {
  id: string
  role: UserRole
  description?: string
  created_at: Date
  updated_at: Date
}

export interface PermissionMapping {
  id: string
  role: UserRole
  resource: string
  action: string
  can_access: boolean
  created_at: Date
}

/**
 * PHASE 2: LMS Engine
 */

export interface Category {
  id: string
  name: string
  description?: string
  slug?: string
  icon_url?: string
  display_order: number
  is_active: boolean
  created_at: Date
  updated_at: Date
  created_by?: string
}

export enum DifficultyLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

export interface Course {
  id: string
  title: string
  slug?: string
  description?: string
  teacher_id: string
  category_id: string
  is_public: boolean
  is_published: boolean
  thumbnail_url?: string
  duration_minutes?: number
  difficulty_level?: DifficultyLevel
  language: string
  total_lessons: number
  created_at: Date
  updated_at: Date
}

export interface Lesson {
  id: string
  course_id: string
  title: string
  description?: string
  video_url?: string
  audio_url?: string
  transcript_text?: string
  lesson_order: number
  duration_minutes?: number
  is_published: boolean
  created_at: Date
  updated_at: Date
}

export interface LessonAttachment {
  id: string
  lesson_id: string
  file_url: string
  file_type: 'PDF' | 'DOC' | 'DOCX' | 'XLSX' | 'PPTX' | 'ZIP' | 'OTHER'
  file_name: string
  file_size_bytes?: number
  display_order: number
  created_at: Date
  updated_at: Date
}

export enum EnrollmentStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  DROPPED = 'DROPPED',
}

export interface Enrollment {
  id: string
  student_id: string
  course_id: string
  progress_percentage: number
  last_accessed_at?: Date
  completed_at?: Date
  status: EnrollmentStatus
  enrolled_at: Date
  updated_at: Date
}

export interface LessonProgress {
  id: string
  enrollment_id: string
  lesson_id: string
  is_completed: boolean
  is_in_progress: boolean
  watched_duration_seconds: number
  started_at?: Date
  completed_at?: Date
  created_at: Date
  updated_at: Date
}

/**
 * PHASE 3: Invitation System
 */

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export interface Invitation {
  id: string
  email: string
  token: string
  role_to_assign: UserRole
  target_course_id?: string
  status: InvitationStatus
  expires_at: Date
  invited_by: string
  accepted_at?: Date
  accepted_by_user_id?: string
  created_at: Date
  updated_at: Date
}

export interface InvitationHistory {
  id: string
  invitation_id: string
  previous_status?: InvitationStatus
  new_status: InvitationStatus
  changed_by?: string
  reason?: string
  changed_at: Date
}

/**
 * PHASE 4: Parent-Student Relations
 */

export enum RelationshipType {
  FATHER = 'FATHER',
  MOTHER = 'MOTHER',
  GUARDIAN = 'GUARDIAN',
  OTHER = 'OTHER',
}

export interface ParentStudentLink {
  id: string
  parent_id: string
  student_id: string
  relationship_type?: RelationshipType
  is_active: boolean
  verified: boolean
  verified_at?: Date
  created_at: Date
  updated_at: Date
}

export interface ParentStudentLinkAudit {
  id: string
  parent_student_link_id: string
  action: 'CREATED' | 'VERIFIED' | 'UNLINKED' | 'ACTIVATED' | 'DEACTIVATED'
  performed_by?: string
  reason?: string
  created_at: Date
}

/**
 * Composite Types for API Responses
 */

export interface CourseWithDetails extends Course {
  teacher?: User
  category?: Category
  lessons?: Lesson[]
  enrollmentCount?: number
}

export interface EnrollmentWithProgress extends Enrollment {
  course?: Course
  student?: User
  progress?: LessonProgress[]
}

export interface ParentStudentLinkWithDetails extends ParentStudentLink {
  parent?: User
  student?: User
}

/**
 * Request/Response Types for API Endpoints
 */

export interface CreateInvitationRequest {
  email: string
  role_to_assign: UserRole
  target_course_id?: string
  expires_at?: Date
}

export interface AcceptInvitationRequest {
  token: string
  user_id: string
}

export interface CreateCourseRequest {
  title: string
  description?: string
  category_id: string
  teacher_id: string
  is_public?: boolean
  difficulty_level?: DifficultyLevel
  language?: string
}

export interface CreateLessonRequest {
  course_id: string
  title: string
  description?: string
  video_url?: string
  audio_url?: string
  lesson_order: number
}

export interface LinkParentStudentRequest {
  parent_id: string
  student_id: string
  relationship_type?: RelationshipType
}
