'use client'

import { useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Download, Loader2 } from 'lucide-react'

interface PrintQrClientProps {
  businessName: string
  shortCode: string
}

export default function PrintQrClient({ businessName, shortCode }: PrintQrClientProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)

  const joinUrl = `https://fidelizy.vercel.app/join?code=${shortCode}`

  async function handleDownloadPdf() {
    if (!printRef.current) return
    setLoading(true)

    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      const canvas = await html2canvas(printRef.current, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
      })

      // A5 landscape: 210 x 148 mm
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      const imgData = canvas.toDataURL('image/png')
      const imgRatio = canvas.width / canvas.height
      const pageRatio = pageWidth / pageHeight

      let imgW: number, imgH: number
      if (imgRatio > pageRatio) {
        imgW = pageWidth
        imgH = pageWidth / imgRatio
      } else {
        imgH = pageHeight
        imgW = pageHeight * imgRatio
      }

      const x = (pageWidth - imgW) / 2
      const y = (pageHeight - imgH) / 2

      pdf.addImage(imgData, 'PNG', x, y, imgW, imgH)
      pdf.save(`fidelizy-qr-${shortCode}.pdf`)
    } catch (error) {
      console.error('Erreur lors de la generation du PDF:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">QR Code imprimable</h1>
        <button
          onClick={handleDownloadPdf}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Telecharger le PDF
        </button>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div
          ref={printRef}
          className="bg-white px-8 py-10 flex flex-col items-center text-center"
          style={{ minHeight: '500px' }}
        >
          {/* Logo / Brand */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-indigo-600">Fidelizy</span>
          </div>

          {/* Business name */}
          <h2 className="text-2xl font-bold text-gray-900 mb-8">{businessName}</h2>

          {/* QR Code */}
          <div className="p-4 bg-white border-2 border-gray-100 rounded-2xl mb-6">
            <QRCodeSVG
              value={joinUrl}
              size={220}
              level="H"
              includeMargin={false}
            />
          </div>

          {/* Short code */}
          <p className="text-4xl font-mono font-bold text-gray-900 tracking-[0.3em] mb-6">
            {shortCode}
          </p>

          {/* CTA */}
          <p className="text-lg text-gray-600 max-w-sm leading-relaxed">
            Scannez pour rejoindre notre programme de fidelite
          </p>
        </div>
      </div>
    </div>
  )
}
