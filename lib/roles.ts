// Maps a user role to the dashboard path they should land on after login.
// Kept free of server-only imports so it can be used in client components too.

export type AppRole =
  | "student"
  | "reader"
  | "admin"
  | "student_supervisor"
  | "reciter_supervisor"
  | "initiative_admin"

export function roleHomePath(role: string | null | undefined): string {
  switch (role) {
    case "reader":
      return "/reader"
    case "admin":
    case "student_supervisor":
    case "reciter_supervisor":
      return "/admin"
    case "initiative_admin":
      return "/initiative"
    case "student":
    default:
      return "/student"
  }
}
