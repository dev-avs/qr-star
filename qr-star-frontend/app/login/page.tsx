'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { authenticate } from '@/lib/api'
import { setSessionToken } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { BrandTitle } from '@/components/brand'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const router = useRouter()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)
    const res = await authenticate({ username, password })
    setLoading(false)
    if (res.error) {
      setErrorMsg(typeof res.message === 'string' ? res.message : 'Login failed')
      return
    }
    const token = String(res.message)
    setSessionToken(token) // persists for 1 day
    router.replace('/dashboard')
  }

  return (
    <main className="min-h-[100svh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex items-center justify-center">
            <BrandTitle withMark size="lg" subtitle="Short links and beautiful QR codes" />
          </div>
          <CardTitle className="sr-only">Login</CardTitle>
          <CardDescription>Sign in to continue</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {errorMsg ? <p className="text-sm text-red-600">{errorMsg}</p> : null}
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
