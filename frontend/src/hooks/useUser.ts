// src/hooks/useUser.ts
// Uses real /users/register and /users/me endpoints from Person 1's backend
// Handles 409 Conflict gracefully — fetches existing user instead of erroring

import { useEffect, useState } from 'react'
import { useAuth, useUser as useClerkUser } from '@clerk/nextjs'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tablet-royal-timid.ngrok-free.dev/api/v1'

const headers = (token: string) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
  'ngrok-skip-browser-warning': 'true',
})

export function useUser() {
  const { getToken } = useAuth()
  const { user: clerkUser } = useClerkUser()
  const [orgId, setOrgId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!clerkUser) return

    async function init() {
      try {
        const token = await getToken()
        if (!token) return

        // Step 1 — Try to get existing user first
        let backendUser: any = null
        try {
          const res = await fetch(`${BASE_URL}/users/me`, {
            headers: headers(token),
          })
          if (res.ok) {
            backendUser = await res.json()
          }
        } catch {
          // Will try to register below
        }

        // Step 2 — Register if not found
        if (!backendUser) {
          const res = await fetch(`${BASE_URL}/users/register`, {
            method: 'POST',
            headers: headers(token),
            body: JSON.stringify({
              email: clerkUser!.emailAddresses[0].emailAddress,
              full_name: clerkUser!.fullName || clerkUser!.firstName || 'User',
              clerk_user_id: clerkUser!.id,
              role: 'admin',
            }),
          })

          if (res.ok) {
            // New user registered successfully
            backendUser = await res.json()
          } else if (res.status === 409) {
            // User already exists — fetch them via /users/me
            const meRes = await fetch(`${BASE_URL}/users/me`, {
              headers: headers(token),
            })
            if (meRes.ok) {
              backendUser = await meRes.json()
            } else {
              throw new Error('User exists but could not fetch profile')
            }
          } else {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.detail || `Registration failed: ${res.status}`)
          }
        }

        setUserId(backendUser.id)
        setOrgId(backendUser.organisation_id)

        // Clean up old localStorage workaround if it exists
        localStorage.removeItem(`aiguard_org_${clerkUser!.id}`)

      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [clerkUser])

  return { orgId, userId, loading, error }
}
