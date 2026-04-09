'use client'

import { useEffect, useState } from 'react'
import { HexColorPicker } from 'react-colorful'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

function normalizeHex(v: string): string {
  let s = (v || '').trim().toLowerCase()
  if (!s) return '#000000'
  if (!s.startsWith('#')) s = `#${s}`
  // Expand 3-digit to 6-digit
  if (s.length === 4) {
    s = `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`
  }
  // Enforce valid 7-char hex, else fallback
  if (!/^#([0-9a-f]{6})$/.test(s)) return '#000000'
  return s
}

export function ColorPicker({
  label,
  value,
  onChange,
}: {
  label?: string
  value: string // hex like "#1f2937"
  onChange: (hex: string) => void
}) {
  const [hex, setHex] = useState<string>(normalizeHex(value))

  // Sync with external changes
  useEffect(() => {
    setHex(normalizeHex(value))
  }, [value])

  // Update upstream when local changes
  function setAndEmit(next: string) {
    const withHash = next.startsWith('#') ? next : `#${next}`
    const norm = normalizeHex(withHash)
    setHex(norm)
    onChange(norm)
  }

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        {label ? <Label className="block">{label}</Label> : null}

        <div className="flex items-center gap-3">
          <div
            className="h-8 w-8 rounded border"
            style={{ background: hex }}
            aria-label="color preview"
          />
          <Input
            aria-label="HEX color"
            value={hex}
            onChange={(e) => setAndEmit(e.target.value)}
            placeholder="#000000"
          />
        </div>

        <div className="flex items-center justify-center">
          <div style={{ width: 220 }}>
            <HexColorPicker color={hex} onChange={(c) => setAndEmit(c)} />
          </div>
        </div>

        {/* Inline minimal CSS for react-colorful to avoid external CSS import */}
        <style jsx global>{`
          .react-colorful,
          .react-colorful * {
            box-sizing: border-box;
          }
          .react-colorful {
            width: 100%;
            height: auto;
            font-family: inherit;
          }
          .react-colorful__saturation {
            position: relative;
            padding-bottom: 75%;
            border-radius: 8px;
            background:
              linear-gradient(0deg, #000, transparent),
              linear-gradient(90deg, #fff, hsla(0, 0%, 100%, 0));
            overflow: hidden;
            touch-action: none;
            user-select: none;
          }
          .react-colorful__saturation-pointer {
            position: absolute;
            width: 18px;
            height: 18px;
            transform: translate(-9px, -9px);
            border: 2px solid #fff;
            border-radius: 50%;
            box-shadow:
              0 0 0 1px rgba(0, 0, 0, 0.2),
              0 2px 4px rgba(0, 0, 0, 0.2),
              inset 0 0 0 1px rgba(0, 0, 0, 0.1);
          }
          .react-colorful__hue,
          .react-colorful__alpha {
            position: relative;
            height: 16px;
            margin-top: 12px;
            border-radius: 8px;
            overflow: hidden;
            touch-action: none;
            user-select: none;
          }
          .react-colorful__hue {
            background: linear-gradient(
              90deg,
              #f00,
              #ff0,
              #0f0,
              #0ff,
              #00f,
              #f0f,
              #f00
            );
          }
          .react-colorful__alpha {
            background-image:
              linear-gradient(45deg, #ccc 25%, transparent 25%),
              linear-gradient(-45deg, #ccc 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #ccc 75%),
              linear-gradient(-45deg, transparent 75%, #ccc 75%);
            background-size: 12px 12px;
            background-position: 0 0, 0 6px, 6px -6px, -6px 0px;
          }
          .react-colorful__alpha-gradient,
          .react-colorful__hue-gradient {
            position: absolute;
            inset: 0;
          }
          .react-colorful__alpha-pointer,
          .react-colorful__hue-pointer {
            position: absolute;
            top: 50%;
            width: 18px;
            height: 18px;
            transform: translate(-9px, -50%);
            border-radius: 50%;
            background: #fff;
            box-shadow:
              0 0 0 1px rgba(0, 0, 0, 0.2),
              0 2px 4px rgba(0, 0, 0, 0.2),
              inset 0 0 0 1px rgba(0, 0, 0, 0.1);
          }
        `}</style>
      </CardContent>
    </Card>
  )
}
