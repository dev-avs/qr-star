'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getValidSessionToken } from '@/lib/auth-client'

export default function Page() {
  const router = useRouter()

  useEffect(() => {
    const token = getValidSessionToken()
    if (token) {
      router.replace('/dashboard')
    } else {
      router.replace('/login')
    }
  }, [router])

  return null
}
