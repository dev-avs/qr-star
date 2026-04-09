'use client'

import { useMemo, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil, Trash2, Copy, QrCode, Save, Download } from 'lucide-react'
import { BASE_URL } from '@/lib/constants'
import { getValidSessionToken } from '@/lib/auth-client'
import { deleteLink, editLink } from '@/lib/api'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { QRPreview, type QRPreviewHandle } from '@/components/qr-preview'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { ColorPicker } from '@/components/color-picker'

const MAX_EXPORT = 4000

function truncate(str: string, max = 20) {
  if (!str) return ''
  return str.length > max ? str.slice(0, max) + '…' : str
}

export function LinkList({
  initialLinks = [],
  onRefresh = async () => {},
}: {
  initialLinks?: any[]
  onRefresh?: () => Promise<void> | void
}) {
  const [links, setLinks] = useState(initialLinks)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useMemo(() => {
    setLinks(initialLinks)
  }, [initialLinks])

  function LinkCell({ id }: { id: string }) {
    const short = `${BASE_URL}/${id}`
    const idDisplay = truncate(String(id), 20)
    const urlDisplay = truncate(short, 20)
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground" title={String(id)}>{idDisplay}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm" title={short}>{urlDisplay}</span>
          <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(short)}>
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
        </div>
      </div>
    )
  }

  async function handleDelete(id: string) {
    setError(null)
    setMessage(null)
    const token = getValidSessionToken()
    if (!token) {
      setError('Session expired.')
      return
    }
    const res = await deleteLink(token, id)
    if (res.error) {
      setError(typeof res.message === 'string' ? res.message : 'Failed to delete')
    } else {
      setMessage('Deleted successfully')
      await onRefresh()
    }
  }

  return (
    <div className="space-y-4">
      {message ? (
        <Alert>
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableCaption>Your links</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Link</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links?.map((l) => {
                const created = l.createdAt ? new Date(l.createdAt) : null
                const updated = l.updatedAt ? new Date(l.updatedAt) : null
                return (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">
                      <LinkCell id={l.id} />
                    </TableCell>
                    <TableCell className="max-w-[320px] truncate" title={l.content}>
                      {l.content}
                    </TableCell>
                    <TableCell>{l.clicks ?? 0}</TableCell>
                    <TableCell>{created ? created.toLocaleString() : '-'}</TableCell>
                    <TableCell>{updated ? updated.toLocaleString() : '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="secondary" size="sm">
                              <QrCode className="h-4 w-4 mr-2" />
                              QR
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[620px]">
                            <DialogHeader>
                              <DialogTitle>QR Code for {l.id}</DialogTitle>
                            </DialogHeader>
                            <QrDialogContent link={l} />
                          </DialogContent>
                        </Dialog>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          </DialogTrigger>
                          {/* Scrollable dialog with sticky header/footer */}
                          <DialogContent className="p-0 w-[96vw] sm:max-w-[1100px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader className="sticky top-0 z-10 bg-background px-4 py-3 border-b">
                              <DialogTitle>Edit link</DialogTitle>
                            </DialogHeader>

                            <EditDialogContent link={l} onDone={onRefresh} />

                            <div className="sticky bottom-0 z-10 bg-background px-4 py-3 border-t flex items-center justify-between gap-3">
                              <div className="text-xs text-muted-foreground">
                                Changes are saved to the server.
                              </div>
                              <div className="flex items-center gap-2">
                                <DialogClose asChild>
                                  <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <SaveButton />
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button variant="destructive" size="sm" onClick={() => handleDelete(l.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

/* ------------- QR dialog content with Download/Export controls ------------- */

function QrDialogContent({ link }: { link: any }) {
  const info = link.qrinfo || {}
  const data = `${BASE_URL}/${link.id}`

  const qrRef = useRef<QRPreviewHandle>(null)
  const [ext, setExt] = useState<'png' | 'svg' | 'jpeg' | 'webp'>('png')
  const [exportSize, setExportSize] = useState(1024)

  const size = info.size ?? 300
  const margin = info.margin ?? 8
  const foreground = info.foreground ?? { mode: 'solid', color: '#1f2937' }
  const background = info.background ?? { mode: 'solid', color: '#ffffff' }
  const logo = info.logo ?? ''
  const logoSize = info.logoSize ?? 0.2
  const dotsType = info.dotsType ?? 'rounded'
  const cornersSquareType = info.cornersSquareType ?? 'square'
  const cornersDotType = info.cornersDotType ?? 'dot'
  const cornersSquareColor = info.cornersSquareColor
  const cornersDotColor = info.cornersDotColor
  const errorCorrection = info.errorCorrection ?? 'Q'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center">
        <QRPreview
          ref={qrRef}
          data={data}
          size={size}
          margin={margin}
          foreground={foreground}
          background={background}
          logo={logo}
          logoSize={logoSize}
          dotsType={dotsType}
          cornersSquareType={cornersSquareType}
          cornersDotType={cornersDotType}
          cornersSquareColor={cornersSquareColor}
          cornersDotColor={cornersDotColor}
          errorCorrection={errorCorrection}
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4 items-end">
        <div className="md:col-span-2 space-y-2">
          <Label>Export size: {exportSize}px (max {MAX_EXPORT})</Label>
          <Slider value={[exportSize]} min={256} max={MAX_EXPORT} step={16} onValueChange={(v) => setExportSize(v[0] ?? 1024)} />
          <p className="text-xs text-muted-foreground">Preview is limited to 350px; export renders at chosen size.</p>
        </div>
        <div className="space-y-2">
          <Label>Format</Label>
          <Select value={ext} onValueChange={(v) => setExt(v as any)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="png">PNG</SelectItem>
              <SelectItem value="svg">SVG</SelectItem>
              <SelectItem value="jpeg">JPEG</SelectItem>
              <SelectItem value="webp">WEBP</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2 justify-center">
        <Button
          type="button"
          variant="secondary"
          onClick={async () => {
            await qrRef.current?.download(ext, exportSize)
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>
    </div>
  )
}

/* ---------------- Edit Dialog content with shared state (unchanged except context) ---------------- */

type QrState = ReturnType<typeof useQrStateFromInfo>
let latestState: {
  link: any
  content: string
  newlinkid: string
  qr: QrState
  onDone?: () => Promise<void> | void
} | null = null

function useQrStateFromInfo(info: any) {
  const [size, setSize] = useState<number>(info.size ?? 300)
  const [margin, setMargin] = useState<number>(info.margin ?? 8)
  const [dotsType, setDotsType] =
    useState<'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'square' | 'extra-rounded'>(info.dotsType ?? 'rounded')
  const [cornersSquareType, setCornersSquareType] =
    useState<'dot' | 'square' | 'extra-rounded'>(info.cornersSquareType ?? 'square')
  const [cornersDotType, setCornersDotType] = useState<'dot' | 'square'>(info.cornersDotType ?? 'dot')
  const [errorCorrection, setErrorCorrection] =
    useState<'L' | 'M' | 'Q' | 'H'>(info.errorCorrection ?? 'Q')

  const initialFg = info.foreground ?? { mode: 'solid', color: '#1f2937' }
  const [fgMode, setFgMode] = useState<'solid' | 'linear'>(initialFg.mode ?? 'solid')
  const [fgColor, setFgColor] = useState(initialFg.mode === 'linear' ? initialFg.color1 ?? '#1f2937' : initialFg.color ?? '#1f2937')
  const [fgColor2, setFgColor2] = useState(initialFg.mode === 'linear' ? initialFg.color2 ?? '#111827' : '#111827')
  const [fgAngle, setFgAngle] = useState(initialFg.mode === 'linear' ? initialFg.rotation ?? 0 : 0)

  const initialBg = info.background ?? { mode: 'solid', color: '#ffffff' }
  const [bgTransparent, setBgTransparent] = useState(initialBg.mode === 'solid' && initialBg.color === 'transparent')
  const [bgMode, setBgMode] = useState<'solid' | 'linear'>(initialBg.mode ?? 'solid')
  const [bgColor, setBgColor] = useState(initialBg.mode === 'linear' ? initialBg.color1 ?? '#ffffff' : initialBg.color ?? '#ffffff')
  const [bgColor2, setBgColor2] = useState(initialBg.mode === 'linear' ? initialBg.color2 ?? '#f3f4f6' : '#f3f4f6')
  const [bgAngle, setBgAngle] = useState(initialBg.mode === 'linear' ? initialBg.rotation ?? 0 : 0)

  const [logo, setLogo] = useState(info.logo ?? '')
  const [logoSize, setLogoSize] = useState(info.logoSize ?? 0.2)

  const [csMatchFg, setCsMatchFg] = useState(!(info.cornersSquareColor))
  const [cdMatchFg, setCdMatchFg] = useState(!(info.cornersDotColor))
  const [cornersSquareColor, setCornersSquareColor] = useState(info.cornersSquareColor ?? '#1f2937')
  const [cornersDotColor, setCornersDotColor] = useState(info.cornersDotColor ?? '#111827')

  function buildForeground() {
    return fgMode === 'linear'
      ? ({ mode: 'linear', color1: fgColor, color2: fgColor2, rotation: fgAngle } as const)
      : ({ mode: 'solid', color: fgColor } as const)
  }
  function buildBackground() {
    if (bgTransparent) return { mode: 'solid', color: 'transparent' } as const
    return bgMode === 'linear'
      ? ({ mode: 'linear', color1: bgColor, color2: bgColor2, rotation: bgAngle } as const)
      : ({ mode: 'solid', color: bgColor } as const)
  }
  function buildQrInfo() {
    return {
      size: Math.min(Math.max(size, 100), 350),
      margin,
      foreground: buildForeground(),
      background: buildBackground(),
      logo: logo || undefined,
      logoSize,
      dotsType,
      cornersSquareType,
      cornersDotType,
      cornersSquareColor: csMatchFg ? undefined : cornersSquareColor,
      cornersDotColor: cdMatchFg ? undefined : cornersDotColor,
      errorCorrection,
    }
  }

  return {
    size, setSize, margin, setMargin,
    dotsType, setDotsType, cornersSquareType, setCornersSquareType, cornersDotType, setCornersDotType,
    errorCorrection, setErrorCorrection,
    fgMode, setFgMode, fgColor, setFgColor, fgColor2, setFgColor2, fgAngle, setFgAngle,
    bgTransparent, setBgTransparent, bgMode, setBgMode, bgColor, setBgColor, bgColor2, setBgColor2, bgAngle, setBgAngle,
    logo, setLogo, logoSize, setLogoSize,
    csMatchFg, setCsMatchFg, cdMatchFg, setCdMatchFg, cornersSquareColor, setCornersSquareColor, cornersDotColor, setCornersDotColor,
    buildForeground, buildBackground, buildQrInfo,
  }
}

function EditDialogContent({ link, onDone = async () => {} }: { link: any; onDone?: () => Promise<void> | void }) {
  const [content, setContent] = useState(link.content || '')
  const [newlinkid, setNewlinkid] = useState('')
  const qr = useQrStateFromInfo(link.qrinfo || {})

  latestState = { link, content, newlinkid, qr, onDone }

  const previewId = newlinkid?.trim() || link.id
  const data = `${BASE_URL}/${previewId}`

  return (
    <div className="px-4 py-4 grid md:grid-cols-[1fr_420px] gap-6">
      <div className="space-y-6">
        <Tabs defaultValue="link">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link">Link</TabsTrigger>
            <TabsTrigger value="qr">QR Style</TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="pt-4 space-y-4">
            <div className="space-y-2">
              <Label>Destination URL</Label>
              <Input value={content} onChange={(e) => setContent(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>New ID (optional)</Label>
              <Input placeholder="new-slug" value={newlinkid} onChange={(e) => setNewlinkid(e.target.value)} />
            </div>
          </TabsContent>

          <TabsContent value="qr" className="pt-4 space-y-4">
            <div className="grid grid-cols-5 gap-4">
              <div className="col-span-3 space-y-2">
                <Label>Size: {Math.min(qr.size, 350)}px (max 350)</Label>
                <Slider value={[qr.size]} min={100} max={350} step={5} onValueChange={(v) => qr.setSize(v[0] ?? 300)} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Margin: {qr.margin}px</Label>
                <Slider value={[qr.margin]} min={0} max={32} step={1} onValueChange={(v) => qr.setMargin(v[0] ?? 8)} />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Dots type</Label>
                <Select value={qr.dotsType} onValueChange={(v) => qr.setDotsType(v as any)}>
                  <SelectTrigger><SelectValue placeholder="dots type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rounded">rounded</SelectItem>
                    <SelectItem value="dots">dots</SelectItem>
                    <SelectItem value="classy">classy</SelectItem>
                    <SelectItem value="classy-rounded">classy-rounded</SelectItem>
                    <SelectItem value="square">square</SelectItem>
                    <SelectItem value="extra-rounded">extra-rounded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Outer squares</Label>
                <Select value={qr.cornersSquareType} onValueChange={(v) => qr.setCornersSquareType(v as any)}>
                  <SelectTrigger><SelectValue placeholder="outer squares" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="square">square</SelectItem>
                    <SelectItem value="dot">dot</SelectItem>
                    <SelectItem value="extra-rounded">extra-rounded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Inner squares</Label>
                <Select value={qr.cornersDotType} onValueChange={(v) => qr.setCornersDotType(v as any)}>
                  <SelectTrigger><SelectValue placeholder="inner squares" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dot">dot</SelectItem>
                    <SelectItem value="square">square</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Corner colors */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Outer squares color</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox id="cs-match-edit" checked={qr.csMatchFg} onCheckedChange={(v) => qr.setCsMatchFg(Boolean(v))} />
                    <Label htmlFor="cs-match-edit" className="text-xs text-muted-foreground">Match foreground</Label>
                  </div>
                </div>
                <div className={qr.csMatchFg ? 'pointer-events-none opacity-50' : ''}>
                  <ColorPicker value={qr.cornersSquareColor} onChange={qr.setCornersSquareColor} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Inner squares color</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox id="cd-match-edit" checked={qr.cdMatchFg} onCheckedChange={(v) => qr.setCdMatchFg(Boolean(v))} />
                    <Label htmlFor="cd-match-edit" className="text-xs text-muted-foreground">Match foreground</Label>
                  </div>
                </div>
                <div className={qr.cdMatchFg ? 'pointer-events-none opacity-50' : ''}>
                  <ColorPicker value={qr.cornersDotColor} onChange={qr.setCornersDotColor} />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Foreground</Label>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mode</Label>
                  <Select value={qr.fgMode} onValueChange={(v) => qr.setFgMode(v as any)}>
                    <SelectTrigger><SelectValue placeholder="mode" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solid">Solid</SelectItem>
                      <SelectItem value="linear">Linear gradient</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {qr.fgMode === 'linear' ? (
                  <div className="space-y-2">
                    <Label>Angle: {qr.fgAngle}°</Label>
                    <Slider value={[qr.fgAngle]} min={0} max={360} step={1} onValueChange={(v) => qr.setFgAngle(v[0] ?? 0)} />
                  </div>
                ) : null}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <ColorPicker label={qr.fgMode === 'solid' ? 'Color' : 'Start color'} value={qr.fgColor} onChange={qr.setFgColor} />
                {qr.fgMode === 'linear' ? (
                  <ColorPicker label="End color" value={qr.fgColor2} onChange={qr.setFgColor2} />
                ) : null}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Background</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="bg-transparent-edit"
                  checked={qr.bgTransparent}
                  onCheckedChange={(v) => qr.setBgTransparent(Boolean(v))}
                />
                <Label htmlFor="bg-transparent-edit">Transparent background</Label>
              </div>

              <div className={qr.bgTransparent ? 'pointer-events-none opacity-50' : ''}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mode</Label>
                    <Select value={qr.bgMode} onValueChange={(v) => qr.setBgMode(v as any)}>
                      <SelectTrigger><SelectValue placeholder="mode" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solid">Solid</SelectItem>
                        <SelectItem value="linear">Linear gradient</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {qr.bgMode === 'linear' ? (
                    <div className="space-y-2">
                      <Label>Angle: {qr.bgAngle}°</Label>
                      <Slider value={[qr.bgAngle]} min={0} max={360} step={1} onValueChange={(v) => qr.setBgAngle(v[0] ?? 0)} />
                    </div>
                  ) : null}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <ColorPicker label={qr.bgMode === 'solid' ? 'Color' : 'Start color'} value={qr.bgColor} onChange={qr.setBgColor} />
                  {qr.bgMode === 'linear' ? (
                    <ColorPicker label="End color" value={qr.bgColor2} onChange={qr.setBgColor2} />
                  ) : null}
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Logo URL (or upload below)</Label>
                <Input
                  placeholder="https://domain/logo.png"
                  value={qr.logo.startsWith?.('data:') ? '' : qr.logo}
                  onChange={(e) => qr.setLogo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Logo size: {(qr.logoSize * 100).toFixed(0)}%</Label>
                <Slider value={[qr.logoSize]} min={0} max={0.5} step={0.01} onValueChange={(v) => qr.setLogoSize(v[0] ?? 0.2)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Upload logo</Label>
              <Input type="file" accept="image/*" onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const dataUrl = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader()
                  reader.onload = () => resolve(String(reader.result))
                  reader.onerror = () => reject(new Error('Failed to read file'))
                  reader.readAsDataURL(file)
                })
                qr.setLogo(dataUrl)
              }} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="border-t md:border-t-0 md:border-l p-4 flex items-center justify-center">
        <QRPreview
          data={data}
          size={qr.size}
          margin={qr.margin}
          foreground={qr.buildForeground()}
          background={qr.buildBackground()}
          logo={qr.logo}
          logoSize={qr.logoSize}
          dotsType={qr.dotsType}
          cornersSquareType={qr.cornersSquareType}
          cornersDotType={qr.cornersDotType}
          cornersSquareColor={qr.csMatchFg ? undefined : qr.cornersSquareColor}
          cornersDotColor={qr.cdMatchFg ? undefined : qr.cornersDotColor}
          errorCorrection={qr.errorCorrection}
        />
      </div>
    </div>
  )
}

function SaveButton() {
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  async function save() {
    if (!latestState) return
    setSaving(true)
    setErr(null)
    const token = getValidSessionToken()
    if (!token) {
      setErr('Session expired.')
      setSaving(false)
      return
    }
    const { link, content, newlinkid, qr, onDone } = latestState
    const res = await editLink(token, {
      linkid: link.id,
      content,
      newlinkid: newlinkid || undefined,
      qrinfo: qr.buildQrInfo(),
    })
    setSaving(false)
    if (res.error) {
      setErr(typeof res.message === 'string' ? res.message : 'Failed to save')
    } else {
      await onDone?.()
      const active = document.querySelector('[data-state="open"][role="dialog"] button[aria-label="Close"]') as HTMLButtonElement | null
      active?.click()
    }
  }
  return (
    <div className="flex items-center gap-2">
      {err ? <span className="text-xs text-red-600">{err}</span> : null}
      <Button onClick={save} disabled={saving}>
        <Save className="h-4 w-4 mr-2" />
        {saving ? 'Saving...' : 'Save'}
      </Button>
    </div>
  )
}
