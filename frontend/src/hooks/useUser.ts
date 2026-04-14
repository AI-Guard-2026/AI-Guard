// src/hooks/useUser.ts
// Fetches current user from backend after Clerk auth
// Returns user data including org_id needed for all API calls

import { useEffect, useState } from 'react'
import { useAuth, useUser as useClerkUser } from '@clerk/nextjs'
import { getMe, registerUser } from '@/lib/api'

interface BackendUser {
  id: string
  email: string
  full_name: string
  clerk_user_id: string
  organisation_id: string
  role: string
}

export function useUser() {
  const { getToken } = useAuth()
  const { user: clerkUser } = useClerkUser()
  const [user, setUser] = useState<BackendUser | null>(null)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!clerkUser) return

    async function init() {
      try {
        const token = await getToken()
        if (!token) return

        // Try to get existing user
        let backendUser: BackendUser
        try {
          backendUser = await getMe(token)
        } catch {
          // User doesn't exist yet — register them
          backendUser = await registerUser(token, {
            email: clerkUser!.emailAddresses[0].emailAddress,
            full_name: clerkUser!.fullName || clerkUser!.firstName || 'User',
            clerk_user_id: clerkUser!.id,
            role: 'admin',
          })
        }

        setUser(backendUser)
        setOrgId(backendUser.organisation_id)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [clerkUser])

  return { user, orgId, loading, error }
}