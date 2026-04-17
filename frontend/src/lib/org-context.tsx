'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useUser, useAuth } from '@clerk/nextjs'
import { registerUser } from './api'

interface OrgContext {
  orgId: string | null
  loading: boolean
}

const OrgCtx = createContext<OrgContext>({ orgId: null, loading: true })

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoaded || !user) return

    async function init() {
      try {
        const stored = localStorage.getItem('aiguard_org_id')
        if (stored) {
          setOrgId(stored)
          setLoading(false)
          return
        }

        const token = await getToken() || ''

        const data = await registerUser(token, {
          email: user!.emailAddresses[0].emailAddress,
          full_name: user!.fullName || 'User',
          clerk_user_id: user!.id,
          role: 'admin',
        })

        if (data?.organisation_id) {
          localStorage.setItem('aiguard_org_id', data.organisation_id)
          setOrgId(data.organisation_id)
        }
      } catch (err) {
        console.error('Org init failed:', err)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [user, isLoaded])

  return <OrgCtx.Provider value={{ orgId, loading }}>{children}</OrgCtx.Provider>
}

export function useOrg() {
  return useContext(OrgCtx)
}