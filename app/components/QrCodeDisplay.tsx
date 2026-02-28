'use client'

import { QRCodeSVG } from 'qrcode.react'

interface QrCodeDisplayProps {
  value: string
  size?: number
}

export default function QrCodeDisplay({ value, size = 200 }: QrCodeDisplayProps) {
  return (
    <QRCodeSVG
      value={value}
      size={size}
      level="M"
      includeMargin
      bgColor="#ffffff"
      fgColor="#1e1b4b"
    />
  )
}
