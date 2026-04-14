// src/hooks/useUser.ts
// Temporary: creates an org on first load, stores org_id in localStorage
// Will be updated once Person 1 adds /users/register and /users/me endpoints

import { useEffect, useState } from 'react'
import { useAuth, useUser as useClerkUser } from '@clerk/nextjs'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tablet-royal-timid.ngrok-free.dev/api/v1'

export function useUser() {
  const { getToken } = useAuth()
  const { user: clerkUser } = useClerkUser()
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!clerkUser) return

    async function init() {
      try {
        const token = await getToken()
        if (!token) return

        // Check if we already have an org stored for this Clerk user
        const storageKey = `aiguard_org_${clerkUser!.id}`
        const stored = localStorage.getItem(storageKey)

        if (stored) {
          setOrgId(stored)
          setLoading(false)
          return
        }

        // No org yet — create one
        const res = await fetch(`${BASE_URL}/organisations/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify({
            name: clerkUser!.fullName || clerkUser!.firstName || 'My Organisation',
            sector: 'technology',
            country: 'Ireland',
          }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.detail || `Failed to create org: ${res.status}`)
        }

        const org = await res.json()
        localStorage.setItem(storageKey, org.id)
        setOrgId(org.id)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [clerkUser])

  return { orgId, loading, error }
}