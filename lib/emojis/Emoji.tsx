'use client'

import { useState, useMemo } from 'react'
import { cx } from '@/utils/cx'
import {
  EMOJI_CATALOG,
  getEmojiAssetUrl,
  getEntry,
  lookupByUnicode,
  type EmojiName,
} from './emoji-mapping'

interface EmojiBaseProps {
  size?: number
  className?: string
  /** Si fourni, override le label aria — sinon `aria-hidden` est appliqué (emoji décoratif). */
  ariaLabel?: string
}

interface EmojiByNameProps extends EmojiBaseProps {
  name: EmojiName
  unicode?: never
}

interface EmojiByUnicodeProps extends EmojiBaseProps {
  unicode: string
  name?: never
}

export type EmojiProps = EmojiByNameProps | EmojiByUnicodeProps

/**
 * Rendu unifié d'un emoji du catalogue Izou.
 *
 * Source par défaut : Microsoft Fluent Emoji via CDN jsDelivr (PNG color).
 * Fallback automatique : caractère Unicode si l'asset CDN ne charge pas.
 *
 * Deux modes d'usage :
 * 1. `<Emoji name="cookie" size={32} />` — par nom catalogue
 * 2. `<Emoji unicode="🎁" />` — par Unicode (rétrocompat des paliers DB stockés en string Unicode)
 */
export function Emoji(props: EmojiProps) {
  const { size = 24, className, ariaLabel } = props

  const resolved = useMemo(() => {
    if ('name' in props && props.name) {
      const entry = getEntry(props.name)
      return { name: props.name, unicode: entry.unicode, label: entry.label }
    }
    const unicode = ('unicode' in props && props.unicode) || ''
    const name = lookupByUnicode(unicode)
    return {
      name,
      unicode,
      label: name ? EMOJI_CATALOG[name].label : unicode,
    }
  }, [props])

  const [imgFailed, setImgFailed] = useState(false)
  const ariaProps = ariaLabel ? { 'aria-label': ariaLabel, role: 'img' } : { 'aria-hidden': true as const }

  // Pas d'asset CDN dispo (Unicode hors catalogue) ou img failed → Unicode brut
  if (!resolved.name || imgFailed) {
    return (
      <span
        {...ariaProps}
        className={cx('inline-block leading-none', className)}
        style={{ fontSize: size, lineHeight: 1 }}
      >
        {resolved.unicode}
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={getEmojiAssetUrl(resolved.name)}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setImgFailed(true)}
      alt={ariaLabel ?? ''}
      className={cx('inline-block select-none', className)}
      style={{ width: size, height: size }}
      {...(ariaLabel ? {} : { 'aria-hidden': true })}
    />
  )
}
