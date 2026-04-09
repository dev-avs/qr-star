'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getValidSessionToken, clearSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getCurrentUser, listLinks } from '@/lib/api'
import { LinkList } from '@/components/link-list'
import { LinkForm } from '@/components/link-form'
import { Loader2, LogOut, Pencil, Trash2, Save } from 'lucide-react'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { BrandTitle } from '@/components/brand'

export default function DashboardPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [links, setLinks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = getValidSessionToken()
    if (!t) {
      router.replace('/login')
      return
    }
    setToken(t)
  }, [router])

  useEffect(() => {
    async function load() {
      if (!token) return
      const me = await getCurrentUser(token)
      if (me.error) {
        clearSession()
        router.replace('/login')
        return
      }
      setUser(me.message)
      const list = await listLinks(token)
      if (!list.error && Array.isArray(list.message)) {
        setLinks(list.message)
      }
      setLoading(false)
    }
    load()
  }, [token, router])

  function handleLogout() {
    clearSession()
    router.replace('/login')
  }

  return (
    <main className="min-h-[100svh]">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl p-4 flex items-center justify-between gap-4">
          <BrandTitle
            withMark
            size="md"
            subtitle="Short links and beautiful QR codes"
          />
          <div className="flex items-center gap-3">
            {user ? (
              <span className="text-sm text-muted-foreground">Level {user.level}</span>
            ) : null}
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-amber-500/40 hover:bg-amber-50"
            >
              <LogOut className="h-4 w-4 mr-2 text-amber-600" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl p-4">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </div>
        ) : (
          <Tabs defaultValue="links" className="w-full">
            <TabsList className="bg-amber-50/50">
              <TabsTrigger value="links">My Links</TabsTrigger>
              <TabsTrigger value="create">Create Link</TabsTrigger>
              {user?.level >= 1 ? <TabsTrigger value="admin">Admin</TabsTrigger> : null}
            </TabsList>
            <TabsContent value="links" className="pt-4">
              <Card>
                <CardContent className="pt-6">
                  <LinkList
                    initialLinks={links}
                    onRefresh={async () => {
                      if (!token) return
                      const res = await listLinks(token)
                      if (!res.error && Array.isArray(res.message)) {
                        setLinks(res.message)
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="create" className="pt-4">
              <LinkForm
                onCreated={async () => {
                  if (!token) return
                  const res = await listLinks(token)
                  if (!res.error && Array.isArray(res.message)) {
                    setLinks(res.message)
                  }
                }}
              />
            </TabsContent>
            <TabsContent value="admin" className="pt-4">
              {user?.level >= 1 ? (
                <AdminPanel userLevel={user?.level ?? 0} currentUsername={user?.username ?? ''} />
              ) : (
                <p className="text-sm text-muted-foreground">You do not have permission to view this tab.</p>
              )}
            </TabsContent>
          </Tabs>
        )}
      </section>
    </main>
  )
}

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createUser, deleteUser, changePassword, adminListAllLinks, adminListAllUsers } from '@/lib/api'
import { getValidSessionToken as _getToken } from '@/lib/auth-client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BASE_URL } from '@/lib/constants'
import { Separator } from '@/components/ui/separator'

function AdminPanel({ userLevel, currentUsername }: { userLevel: number; currentUsername: string }) {
  const [newUser, setNewUser] = useState({ username: '', password: '', level: 0 })
  const [status, setStatus] = useState<string | null>(null)

  // Level 2 lists
  const [allLinks, setAllLinks] = useState<any[] | null>(null)
  const [allUsers, setAllUsers] = useState<any[] | null>(null)
  const [loadingLists, setLoadingLists] = useState(false)
  const [listsError, setListsError] = useState<string | null>(null)

  async function withToken<T>(fn: (t: string) => Promise<T>) {
    const t = _getToken()
    if (!t) {
      setStatus('Session expired. Please login again.')
      throw new Error('No token')
    }
    return fn(t)
  }

  async function loadAll() {
    setListsError(null)
    setLoadingLists(true)
    try {
      const t = _getToken()
      if (!t) throw new Error('No token')
      const [linksRes, usersRes] = await Promise.all([adminListAllLinks(t), adminListAllUsers(t)])
      if (!linksRes.error && Array.isArray(linksRes.message)) {
        setAllLinks(linksRes.message)
      } else {
        setAllLinks([])
        setListsError(typeof linksRes.message === 'string' ? linksRes.message : 'Failed to load links')
      }
      if (!usersRes.error && Array.isArray(usersRes.message)) {
        setAllUsers(usersRes.message)
      } else {
        setAllUsers([])
        setListsError((prev) => prev || (typeof usersRes.message === 'string' ? usersRes.message : 'Failed to load users'))
      }
    } catch (e: any) {
      setListsError(e?.message || 'Failed to load admin data')
    } finally {
      setLoadingLists(false)
    }
  }

  // Auto-load for level 2 admins
  useEffect(() => {
    if (userLevel >= 2) {
      loadAll()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLevel])

  // Per-user actions with self-guards
  async function handleDeleteUser(username: string) {
    if (!username) return
    if (username === currentUsername) {
      setStatus('You cannot delete your own user.')
      return
    }
    const ok = window.confirm(`Delete user "${username}"? This cannot be undone.`)
    if (!ok) return
    try {
      await withToken((t) => deleteUser(t, username))
      await loadAll()
    } catch {}
  }

  async function handleChangePassword(username: string, password: string) {
    if (!username || !password) return
    if (username === currentUsername) {
      setStatus('You cannot change your own password here. Use your account settings.')
      return
    }
    try {
      await withToken((t) => changePassword(t, { username, password }))
      await loadAll()
    } catch {}
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Create User */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-medium">Create User</h3>
          <div className="space-y-2">
            <Label>Username</Label>
            <Input value={newUser.username} onChange={(e) => setNewUser((s) => ({ ...s, username: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" value={newUser.password} onChange={(e) => setNewUser((s) => ({ ...s, password: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Level (0&#45;2)</Label>
            <Input
              type="number"
              value={newUser.level}
              min={0}
              max={2}
              onChange={(e) => setNewUser((s) => ({ ...s, level: Number(e.target.value) }))}
            />
          </div>
          <Button
            onClick={async () => {
              setStatus(null)
              try {
                const res = await withToken((t) => createUser(t, newUser))
                // @ts-ignore
                setStatus(res.error ? String(res.message) : 'User created')
                // @ts-ignore
                if (!res.error) setNewUser({ username: '', password: '', level: 0 })
              } catch {}
            }}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            Create
          </Button>
          {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
        </CardContent>
      </Card>

      {/* All Links */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">All Links {Array.isArray(allLinks) ? `(${allLinks.length})` : ''}</h3>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={loadAll} disabled={userLevel < 2 || loadingLists} className="hover:bg-amber-50">
                Refresh
              </Button>
            </div>
          </div>
          {userLevel < 2 ? (
            <p className="text-sm text-muted-foreground">Level 2 required to view all links.</p>
          ) : (
            <>
              {listsError ? <p className="text-sm text-red-600">{listsError}</p> : null}
              <div className="max-h-[400px] overflow-auto border rounded">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Short URL</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Clicks</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(allLinks) && allLinks.length > 0 ? (
                      allLinks.map((l: any) => {
                        const short = `${BASE_URL}/${l.id ?? l.linkid ?? ''}`
                        const created = l.createdAt ? new Date(l.createdAt).toLocaleString() : '-'
                        const updated = l.updatedAt ? new Date(l.updatedAt).toLocaleString() : '-'
                        return (
                          <TableRow key={l.id ?? short}>
                            <TableCell className="font-mono text-xs">{String(l.id ?? l.linkid ?? '')}</TableCell>
                            <TableCell className="font-mono text-xs">{short}</TableCell>
                            <TableCell className="max-w-[360px] truncate" title={l.content}>{l.content ?? '-'}</TableCell>
                            <TableCell>{l.clicks ?? 0}</TableCell>
                            <TableCell>{created}</TableCell>
                            <TableCell>{updated}</TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-sm text-muted-foreground">
                          {loadingLists ? 'Loading...' : 'No links'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* All Users with actions */}
      <Card className="md:col-span-2">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">All Users {Array.isArray(allUsers) ? `(${allUsers.length})` : ''}</h3>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={loadAll} disabled={userLevel < 2 || loadingLists} className="hover:bg-amber-50">
                Refresh
              </Button>
            </div>
          </div>
          {userLevel < 2 ? (
            <p className="text-sm text-muted-foreground">Level 2 required to view all users.</p>
          ) : (
            <>
              {listsError ? <p className="text-sm text-red-600">{listsError}</p> : null}
              <div className="max-h-[400px] overflow-auto border rounded">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(allUsers) && allUsers.length > 0 ? (
                      allUsers.map((u: any) => {
                        const isSelf = u.username === currentUsername
                        return (
                          <TableRow key={u.username ?? u.id ?? JSON.stringify(u)}>
                            <TableCell className="font-medium">
                              {u.username ?? '-'} {isSelf ? <span className="ml-2 text-xs text-muted-foreground">(you)</span> : null}
                            </TableCell>
                            <TableCell>{u.level ?? '-'}</TableCell>
                            <TableCell>{u.createdAt ? new Date(u.createdAt).toLocaleString() : '-'}</TableCell>
                            <TableCell>{u.updatedAt ? new Date(u.updatedAt).toLocaleString() : '-'}</TableCell>
                            <TableCell className="text-right">
                              {isSelf ? (
                                <span className="text-xs text-muted-foreground">No actions on your account</span>
                              ) : (
                                <div className="flex justify-end gap-2">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" size="sm" className="hover:bg-amber-50">
                                        <Pencil className="h-4 w-4 mr-2 text-amber-600" />
                                        Edit
                                      </Button>
                                    </DialogTrigger>
                                    <EditUserDialog
                                      username={u.username}
                                      onSave={handleChangePassword}
                                    />
                                  </Dialog>

                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteUser(u.username)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-sm text-muted-foreground">
                          {loadingLists ? 'Loading...' : 'No users'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Small dialog component for changing a user's password
function EditUserDialog({
  username,
  onSave,
}: {
  username: string
  onSave: (username: string, password: string) => Promise<void> | void
}) {
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setError(null)
    if (!password) {
      setError('Password is required')
      return
    }
    setSaving(true)
    try {
      await onSave(username, password)
      // Close dialog programmatically
      const active = document.querySelector('[data-state="open"][role="dialog"] button[aria-label="Close"]') as HTMLButtonElement | null
      active?.click()
    } catch (e: any) {
      setError(e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DialogContent className="sm:max-w-[420px]">
      <DialogHeader>
        <DialogTitle className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 bg-clip-text text-transparent">
          Edit user: {username}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4 pt-2">
        <div className="space-y-2">
          <Label>New Password</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex items-center justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-white">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </DialogContent>
  )
}
