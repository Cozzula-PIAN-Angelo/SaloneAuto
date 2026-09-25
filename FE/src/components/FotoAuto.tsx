import { useState } from 'react'
import type { ImmagineResponse } from '../api/types'
import Icona from './Icona'

/** Foto dell'annuncio, o un segnaposto se manca o non si carica. */
export default function FotoAuto({
  immagine,
  alt,
  className = '',
}: {
  immagine: ImmagineResponse | undefined
  alt: string
  className?: string
}) {
  const [rotta, setRotta] = useState(false)
  if (!immagine || rotta) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-[radial-gradient(ellipse_at_50%_120%,rgba(201,169,110,0.12),transparent_60%),linear-gradient(160deg,#1a1a1e,#0f0f12)] text-line-strong ${className}`}
        role="img"
        aria-label={`${alt}: foto non disponibile`}
      >
        <Icona nome="directions_car" className="text-5xl" />
      </div>
    )
  }
  return (
    <img
      src={immagine.url}
      alt={alt}
      loading="lazy"
      onError={() => setRotta(true)}
      className={`h-full w-full object-cover ${className}`}
    />
  )
}
