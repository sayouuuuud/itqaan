/**
 * Invitation Database Queries
 * Handles user invitations and sign-up flows
 */

import { query, queryOne } from "../db"
import type { Invitation } from "../types/lms"
import crypto from "crypto"

export async function createInvitation(
  email: string,
  role: "STUDENT" | "TEACHER" | "PARENT",
  createdBy: string,
  parentEmail?: string
): Promise<Invitation | null> {
  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  return queryOne<Invitation>(
    `INSERT INTO invitations (token, email, role, createdBy, parentEmail, expiresAt, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending')
     RETURNING *`,
    [token, email, role, createdBy, parentEmail, expiresAt]
  )
}

export async function validateInvitation(token: string): Promise<Invitation | null> {
  return queryOne<Invitation>(
    `SELECT * FROM invitations 
     WHERE token = $1 AND status = 'pending' AND expiresAt > NOW()`,
    [token]
  )
}

export async function useInvitation(token: string, userId: string): Promise<boolean> {
  const result = await query(
    `UPDATE invitations SET status = 'used', usedBy = $1, usedAt = CURRENT_TIMESTAMP 
     WHERE token = $2`,
    [userId, token]
  )
  return result.length > 0
}

export async function revokeInvitation(invitationId: string): Promise<boolean> {
  const result = await query(
    `UPDATE invitations SET status = 'revoked' WHERE id = $1`,
    [invitationId]
  )
  return result.length > 0
}

export async function getInvitationsByCreator(userId: string): Promise<Invitation[]> {
  return query<Invitation>(
    `SELECT * FROM invitations WHERE createdBy = $1 ORDER BY createdAt DESC`,
    [userId]
  )
}

export async function getPendingInvitations(): Promise<Invitation[]> {
  return query<Invitation>(
    `SELECT * FROM invitations WHERE status = 'pending' AND expiresAt > NOW() ORDER BY createdAt DESC`
  )
}

export async function getExpiredInvitations(): Promise<Invitation[]> {
  return query<Invitation>(
    `SELECT * FROM invitations WHERE status = 'pending' AND expiresAt <= NOW() ORDER BY expiresAt DESC`
  )
}

export async function cleanupExpiredInvitations(): Promise<number> {
  const result = await query(
    `UPDATE invitations SET status = 'expired' WHERE status = 'pending' AND expiresAt <= NOW()`
  )
  return result.length
}
