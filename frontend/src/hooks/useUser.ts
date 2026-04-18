// src/hooks/useUser.ts
import { useEffect, useState } from 'react'
import { useAuth, useUser as useClerkUser } from '@clerk/nextjs'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ai-guard-production.up.railway.app/api/v1'

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

        const clerkUserId = clerkUser!.id

        // Step 1 — Try to get existing user by clerk_user_id query param
        let backendUser: any = null
        try {
          const res = await fetch(`${BASE_URL}/users/me?clerk_user_id=${clerkUserId}`, {
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
              clerk_user_id: clerkUserId,
              role: 'admin',
            }),
          })

          if (res.ok) {
            backendUser = await res.json()
          } else if (res.status === 409) {
            // Already exists — fetch by clerk_user_id
            const meRes = await fetch(`${BASE_URL}/users/me?clerk_user_id=${clerkUserId}`, {
              headers: headers(token),
            })
            if (meRes.ok) {
              backendUser = await meRes.json()
            }
          } else {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.detail || `Registration failed: ${res.status}`)
          }
        }

        if (backendUser) {
          setUserId(backendUser.id)
          setOrgId(backendUser.organisation_id)
        }

        // Clean up old localStorage keys
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
