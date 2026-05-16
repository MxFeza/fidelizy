'use client'

import Image from 'next/image'

/**
 * Petit logomark Izou (5 dots) centré au-dessus du titre des écrans onboarding.
 * Voir Figma A2/A3/A4/A5.
 */
export default function IzouBulletLogo() {
  return (
    <Image
      src="/izou-logomark.svg"
      alt=""
      width={32}
      height={32}
      className="size-8 mx-auto"
      aria-hidden="true"
      priority
    />
  )
}
