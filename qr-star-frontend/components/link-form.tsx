'use client'

import { useMemo, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createLink } from '@/lib/api'
import { getValidSessionToken } from '@/lib/auth-client'
import { QRPreview, type QRPreviewHandle } from '@/components/qr-preview'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Copy, LinkIcon, Wand2, Download, RotateCcw } from 'lucide-react'
import { BASE_URL } from '@/lib/constants'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ColorPicker } from '@/components/color-picker'
import { Checkbox } from '@/components/ui/checkbox'

const MAX_EXPORT = 4000

export function LinkForm({ onCreated = () => {} }: { onCreated?: () => void }) {
  const [linkid, setLinkid] = useState('')
  const [content, setContent] = useState('')
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // QR customization state (preview size clamped to 350)
  const [size, setSize] = useState(320)
  const [margin, setMargin] = useState(8)

  // Foreground gradient (hex)
  const [fgMode, setFgMode] = useState<'solid' | 'linear'>('solid')
  const [fgColor, setFgColor] = useState('#1f2937')
  const [fgColor2, setFgColor2] = useState('#111827')
  const [fgAngle, setFgAngle] = useState(0)

  // Background gradient + transparency
  const [bgTransparent, setBgTransparent] = useState(false)
  const [bgMode, setBgMode] = useState<'solid' | 'linear'>('solid')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [bgColor2, setBgColor2] = useState('#f3f4f6')
  const [bgAngle, setBgAngle] = useState(0)

  const [dotsType, setDotsType] =
    useState<'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'square' | 'extra-rounded'>('rounded')
  const [cornersSquareType, setCornersSquareType] =
    useState<'dot' | 'square' | 'extra-rounded'>('square')
  const [cornersDotType, setCornersDotType] = useState<'dot' | 'square'>('dot')

  // Corner color overrides
  const [cornersSquareColor, setCornersSquareColor] = useState('#1f2937')
  const [cornersDotColor, setCornersDotColor] = useState('#111827')
  const [csMatchFg, setCsMatchFg] = useState(true)
  const [cdMatchFg, setCdMatchFg] = useState(true)

  const [errorCorrection, setErrorCorrection] =
    useState<'L' | 'M' | 'Q' | 'H'>('Q')

  const [logo, setLogo] = useState('') // data URL or remote URL
  const [logoSize, setLogoSize] = useState(0.2)

  const [downloadExt, setDownloadExt] =
    useState<'png' | 'svg' | 'jpeg' | 'webp'>('png')
  // New: export size for downloads, independent of preview
  const [exportSize, setExportSize] = useState(1024)

  const qrRef = useRef<QRPreviewHandle>(null)

  const shortUrl = useMemo(() => {
    const id = linkid?.trim()
    if (!id) return ''
    return `${BASE_URL}/${id}`
  }, [linkid])

  function validateStep1(): string | null {
    if (linkid.includes('/')) return 'linkid cannot include "/"'
    try {
      const u = new URL(content)
      if (!u.protocol.startsWith('http')) {
        return 'URL must start with http:// or https://'
      }
    } catch {
      return 'Invalid URL'
    }
    return null
  }

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

  async function handleCreate() {
    setStatus(null)
    setError(null)
    const token = getValidSessionToken()
    if (!token) {
      setError('Session expired. Login again.')
      return
    }
    try {
      const qrinfo = buildQrInfo()
      const res = await createLink(token, {
        linkid: linkid || undefined,
        content,
        qrinfo,
      })
      if (res.error) {
        setError(typeof res.message === 'string' ? res.message : 'Failed to create link')
      } else {
        setStatus('Link created successfully')
        onCreated()
        setStep(1)
        setLinkid('')
        setContent('')
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to create link')
    }
  }

  function resetAppearance() {
    setSize(320)
    setMargin(8)
    setDotsType('rounded')
    setCornersSquareType('square')
    setCornersDotType('dot')
    setErrorCorrection('Q')
    setFgMode('solid'); setFgColor('#1f2937'); setFgColor2('#111827'); setFgAngle(0)
    setBgTransparent(false)
    setBgMode('solid'); setBgColor('#ffffff'); setBgColor2('#f3f4f6'); setBgAngle(0)
    setLogo(''); setLogoSize(0.2)
    setCornersSquareColor('#1f2937'); setCornersDotColor('#111827')
    setCsMatchFg(true); setCdMatchFg(true)
    setExportSize(1024)
  }

  async function onLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
    setLogo(dataUrl)
  }

  const foreground = buildForeground()
  const background = buildBackground()

  const resolvedCSColor = csMatchFg ? undefined : cornersSquareColor
  const resolvedCDColor = cdMatchFg ? undefined : cornersDotColor

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_520px]">
      <Card>
        <CardHeader>
          <CardTitle>1. Enter link info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="linkid">Custom slug (optional)</Label>
              <Input
                id="linkid"
                placeholder="e.g. summer-sale"
                value={linkid}
                onChange={(e) => setLinkid(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for auto-generated ID. Must not contain {'"/"'}.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Destination URL</Label>
              <Input
                id="content"
                placeholder="https://example.com/page"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => {
                const err = validateStep1()
                if (err) {
                  setError(err)
                  return
                }
                setError(null)
                setStep(2)
                setStatus(null)
              }}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Next: Customize QR
            </Button>
            {shortUrl ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(shortUrl)
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy short URL
              </Button>
            ) : null}
          </div>
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Customize & preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step >= 2 ? (
            <>
              <Tabs defaultValue="appearance">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="appearance">Appearance</TabsTrigger>
                  <TabsTrigger value="foreground">Foreground</TabsTrigger>
                  <TabsTrigger value="background">Background</TabsTrigger>
                </TabsList>

                <TabsContent value="appearance" className="space-y-4 pt-4">
                  <div className="grid gap-4">
                    <div className="grid grid-cols-5 gap-4">
                      <div className="col-span-3 space-y-2">
                        <Label>Size: {Math.min(size, 350)}px (max 350)</Label>
                        <Slider value={[size]} min={100} max={350} step={5} onValueChange={(v) => setSize(v[0] ?? 320)} />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label>Margin: {margin}px</Label>
                        <Slider value={[margin]} min={0} max={32} step={1} onValueChange={(v) => setMargin(v[0] ?? 8)} />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Dots type</Label>
                        <Select value={dotsType} onValueChange={(v) => setDotsType(v as any)}>
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
                        <Select value={cornersSquareType} onValueChange={(v) => setCornersSquareType(v as any)}>
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
                        <Select value={cornersDotType} onValueChange={(v) => setCornersDotType(v as any)}>
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
                            <Checkbox id="cs-match" checked={csMatchFg} onCheckedChange={(v) => setCsMatchFg(Boolean(v))} />
                            <Label htmlFor="cs-match" className="text-xs text-muted-foreground">Match foreground</Label>
                          </div>
                        </div>
                        <div className={csMatchFg ? 'pointer-events-none opacity-50' : ''}>
                          <ColorPicker value={cornersSquareColor} onChange={setCornersSquareColor} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Inner squares color</Label>
                          <div className="flex items-center gap-2">
                            <Checkbox id="cd-match" checked={cdMatchFg} onCheckedChange={(v) => setCdMatchFg(Boolean(v))} />
                            <Label htmlFor="cd-match" className="text-xs text-muted-foreground">Match foreground</Label>
                          </div>
                        </div>
                        <div className={cdMatchFg ? 'pointer-events-none opacity-50' : ''}>
                          <ColorPicker value={cornersDotColor} onChange={setCornersDotColor} />
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Error correction</Label>
                        <Select value={errorCorrection} onValueChange={(v) => setErrorCorrection(v as any)}>
                          <SelectTrigger><SelectValue placeholder="ECC" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="L">L (low)</SelectItem>
                            <SelectItem value="M">M (medium)</SelectItem>
                            <SelectItem value="Q">Q (quartile)</SelectItem>
                            <SelectItem value="H">H (high)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <Button type="button" variant="outline" onClick={resetAppearance}>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reset appearance
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="foreground" className="space-y-4 pt-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Mode</Label>
                      <Select value={fgMode} onValueChange={(v) => setFgMode(v as any)}>
                        <SelectTrigger><SelectValue placeholder="mode" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solid">Solid</SelectItem>
                          <SelectItem value="linear">Linear gradient</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {fgMode === 'linear' ? (
                      <div className="space-y-2">
                        <Label>Angle: {fgAngle}°</Label>
                        <Slider value={[fgAngle]} min={0} max={360} step={1} onValueChange={(v) => setFgAngle(v[0] ?? 0)} />
                      </div>
                    ) : null}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <ColorPicker label={fgMode === 'solid' ? 'Color' : 'Start color'} value={fgColor} onChange={setFgColor} />
                    {fgMode === 'linear' ? (
                      <ColorPicker label="End color" value={fgColor2} onChange={setFgColor2} />
                    ) : null}
                  </div>
                </TabsContent>

                <TabsContent value="background" className="space-y-4 pt-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="bg-transparent"
                      checked={bgTransparent}
                      onCheckedChange={(v) => setBgTransparent(Boolean(v))}
                    />
                    <Label htmlFor="bg-transparent">Transparent background</Label>
                  </div>

                  <div className={bgTransparent ? 'pointer-events-none opacity-50' : ''}>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Mode</Label>
                        <Select value={bgMode} onValueChange={(v) => setBgMode(v as any)}>
                          <SelectTrigger><SelectValue placeholder="mode" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="solid">Solid</SelectItem>
                            <SelectItem value="linear">Linear gradient</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {bgMode === 'linear' ? (
                        <div className="space-y-2">
                          <Label>Angle: {bgAngle}°</Label>
                          <Slider value={[bgAngle]} min={0} max={360} step={1} onValueChange={(v) => setBgAngle(v[0] ?? 0)} />
                        </div>
                      ) : null}
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <ColorPicker label={bgMode === 'solid' ? 'Color' : 'Start color'} value={bgColor} onChange={setBgColor} />
                      {bgMode === 'linear' ? (
                        <ColorPicker label="End color" value={bgColor2} onChange={setBgColor2} />
                      ) : null}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <Separator className="my-2" />

              <div className="flex items-center justify-center">
                <QRPreview
                  ref={qrRef}
                  data={shortUrl || `${BASE_URL}/preview`}
                  size={size}
                  margin={margin}
                  foreground={foreground}
                  background={background}
                  logo={logo}
                  dotsType={dotsType}
                  cornersSquareType={cornersSquareType}
                  cornersDotType={cornersDotType}
                  cornersSquareColor={resolvedCSColor}
                  cornersDotColor={resolvedCDColor}
                  errorCorrection={errorCorrection}
                  logoSize={logoSize}
                />
              </div>

              <Tabs defaultValue="logo">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="logo">Logo</TabsTrigger>
                  <TabsTrigger value="export">Export</TabsTrigger>
                </TabsList>
                <TabsContent value="logo" className="space-y-4 pt-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Upload logo</Label>
                      <Input type="file" accept="image/*" onChange={(e) => onLogoFile(e)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Or logo URL</Label>
                      <Input
                        placeholder="https://domain/logo.png"
                        value={logo.startsWith('data:') ? '' : logo}
                        onChange={(e) => setLogo(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Remote images require CORS; we request with crossOrigin="anonymous".
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Logo size: {(logoSize * 100).toFixed(0)}%</Label>
                    <Slider
                      value={[logoSize]}
                      min={0}
                      max={0.5}
                      step={0.01}
                      onValueChange={(v) => setLogoSize(v[0] ?? 0.2)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" type="button" onClick={() => setLogo('')}>
                      Remove logo
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="export" className="space-y-4 pt-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Export size: {exportSize}px (max {MAX_EXPORT})</Label>
                      <Slider
                        value={[exportSize]}
                        min={256}
                        max={MAX_EXPORT}
                        step={16}
                        onValueChange={(v) => setExportSize(v[0] ?? 1024)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Preview stays at max 350px. Export renders at the chosen resolution.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Format</Label>
                      <Select value={downloadExt} onValueChange={(v) => setDownloadExt(v as any)}>
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
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={async () => {
                        await qrRef.current?.download(downloadExt, exportSize)
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button onClick={handleCreate}>
                      <LinkIcon className="h-4 w-4 mr-2" />
                      3. Create Link
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Fill in link info first to customize and generate a QR code.
            </p>
          )}
          {status ? (
            <Alert>
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{status}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
