'use client'

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

type QRCodeStylingType = any

const MIN_SIZE = 100
const MAX_PREVIEW = 350
const MAX_EXPORT = 4000

export type QRPreviewHandle = {
  // If sizePx is provided, export at that size (clamped to 100..4000).
  download: (ext?: 'png' | 'svg' | 'jpeg' | 'webp', sizePx?: number) => Promise<void>
  exportAsDataUrl: (ext?: 'png' | 'jpeg' | 'webp' | 'svg', sizePx?: number) => Promise<string>
}

type SolidColor = { mode: 'solid'; color: string }
type LinearGradient = { mode: 'linear'; color1: string; color2: string; rotation: number }

export type Foreground = SolidColor | LinearGradient
export type Background = SolidColor | LinearGradient

export type QRStyle = {
  data: string
  size?: number // preview only; will be clamped to 350
  foreground: Foreground
  background: Background
  logo?: string
  dotsType?:
    | 'rounded'
    | 'dots'
    | 'classy'
    | 'classy-rounded'
    | 'square'
    | 'extra-rounded'
  cornersSquareType?: 'dot' | 'square' | 'extra-rounded'
  cornersDotType?: 'dot' | 'square'
  errorCorrection?: 'L' | 'M' | 'Q' | 'H'
  margin?: number
  logoSize?: number // 0..1

  // Optional explicit colors for corner shapes
  cornersSquareColor?: string
  cornersDotColor?: string
}

function buildDotsOptions(fg: Foreground, dotsType: QRStyle['dotsType'], colorFallback: string) {
  if (fg.mode === 'linear') {
    return {
      type: dotsType,
      gradient: {
        type: 'linear',
        rotation: fg.rotation,
        colorStops: [
          { offset: 0, color: fg.color1 },
          { offset: 1, color: fg.color2 },
        ],
      },
    }
  }
  return {
    type: dotsType,
    color: fg.color || colorFallback,
  }
}

function buildBackgroundOptions(bg: Background) {
  if (bg.mode === 'linear') {
    return {
      gradient: {
        type: 'linear',
        rotation: bg.rotation,
        colorStops: [
          { offset: 0, color: bg.color1 },
          { offset: 1, color: bg.color2 },
        ],
      },
    }
  }
  return { color: bg.color }
}

function primaryForegroundColor(fg: Foreground) {
  return fg.mode === 'solid' ? fg.color : fg.color1
}
function secondaryForegroundColor(fg: Foreground) {
  return fg.mode === 'solid' ? fg.color : fg.color2
}

export const QRPreview = forwardRef<QRPreviewHandle, QRStyle>(function QRPreview(
  {
    data,
    size = 300,
    foreground,
    background,
    logo = '',
    dotsType = 'rounded',
    cornersSquareType = 'square',
    cornersDotType = 'dot',
    errorCorrection = 'Q',
    margin = 8,
    logoSize = 0.2,
    cornersSquareColor,
    cornersDotColor,
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const qrRef = useRef<QRCodeStylingType | null>(null)

  const clampedPreview = Math.min(Math.max(size, MIN_SIZE), MAX_PREVIEW)

  function makeOptions(targetSize: number) {
    const width = targetSize
    const height = targetSize
    return {
      width,
      height,
      type: 'canvas',
      data,
      image: logo || undefined,
      margin,
      qrOptions: {
        errorCorrectionLevel: errorCorrection,
      },
      imageOptions: {
        crossOrigin: 'anonymous',
        imageSize: logoSize,
        margin: 0,
        hideBackgroundDots: false,
      },
      dotsOptions: buildDotsOptions(foreground, dotsType, '#1f2937'),
      cornersSquareOptions: {
        color: cornersSquareColor ?? primaryForegroundColor(foreground),
        type: cornersSquareType,
      },
      cornersDotOptions: {
        color: cornersDotColor ?? secondaryForegroundColor(foreground),
        type: cornersDotType,
      },
      backgroundOptions: buildBackgroundOptions(background),
    }
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const mod = await import('qr-code-styling')
      if (!mounted) return
      const QRCodeStyling = (mod as any).default

      const options = makeOptions(clampedPreview)

      if (!qrRef.current) {
        qrRef.current = new QRCodeStyling(options)
        if (containerRef.current) {
          containerRef.current.innerHTML = ''
          qrRef.current.append(containerRef.current)
        }
      } else {
        qrRef.current.update(options)
      }
    })()

    return () => {
      mounted = false
    }
  }, [
    data,
    clampedPreview,
    foreground,
    background,
    logo,
    dotsType,
    cornersSquareType,
    cornersDotType,
    errorCorrection,
    margin,
    logoSize,
    cornersSquareColor,
    cornersDotColor,
  ])

  useImperativeHandle(ref, () => ({
    async download(ext: 'png' | 'svg' | 'jpeg' | 'webp' = 'png', sizePx?: number) {
      // If no custom size requested, download from the visible instance (350 max).
      if (!sizePx) {
        await qrRef.current?.download({ name: 'qr', extension: ext })
        return
      }
      const target = Math.min(Math.max(Math.round(sizePx), MIN_SIZE), MAX_EXPORT)
      const mod = await import('qr-code-styling')
      const QRCodeStyling = (mod as any).default
      const temp = new QRCodeStyling(makeOptions(target))
      // Append off-screen to ensure render before download
      const div = document.createElement('div')
      div.style.position = 'fixed'
      div.style.left = '-99999px'
      div.style.top = '0'
      document.body.appendChild(div)
      temp.append(div)
      // small tick to allow layout/render
      await new Promise((r) => setTimeout(r, 50))
      await temp.download({ name: 'qr', extension: ext })
      div.remove()
    },
    async exportAsDataUrl(ext: 'png' | 'jpeg' | 'webp' | 'svg' = 'png', sizePx?: number) {
      // Export at custom size if given, else from visible instance.
      if (!sizePx) {
        const blob: Blob | undefined = await (qrRef.current as any)?.getRawData(ext)
        if (!blob) return ''
        const dataUrl: string = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(String(reader.result))
          reader.readAsDataURL(blob)
        })
        return dataUrl
      }
      const target = Math.min(Math.max(Math.round(sizePx), MIN_SIZE), MAX_EXPORT)
      const mod = await import('qr-code-styling')
      const QRCodeStyling = (mod as any).default
      const temp = new QRCodeStyling(makeOptions(target))
      const blob: Blob = await (temp as any).getRawData(ext)
      const dataUrl: string = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(String(reader.result))
        reader.readAsDataURL(blob)
      })
      return dataUrl
    },
  }))

  return (
    <div className="w-full flex items-center justify-center">
      <div
        ref={containerRef}
        aria-label="QR code preview"
        style={{ width: clampedPreview, height: clampedPreview, maxWidth: MAX_PREVIEW, maxHeight: MAX_PREVIEW }}
      />
    </div>
  )
})
