'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { X, Download, ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'
import { Photo } from '@/types'

interface GalleryPhoto extends Photo {
  authorName?: string
  postDate?: string
}

interface PhotoGalleryProps {
  photos: GalleryPhoto[]
}

function timeAgo(dateStr?: string) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Hier'
  return `Il y a ${days}j`
}

async function downloadPhoto(url: string, index: number) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = `photo-camp-${index + 1}.jpg`
    a.click()
    URL.revokeObjectURL(blobUrl)
  } catch {
    window.open(url, '_blank')
  }
}

export default function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [selected, setSelected] = useState<number | null>(null)

  const open = (i: number) => setSelected(i)
  const close = () => setSelected(null)
  const prev = useCallback(() => setSelected((i) => (i !== null ? (i - 1 + photos.length) % photos.length : null)), [photos.length])
  const next = useCallback(() => setSelected((i) => (i !== null ? (i + 1) % photos.length : null)), [photos.length])

  if (photos.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-orange-50">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-50 rounded-2xl mb-4">
          <ImageOff className="w-8 h-8 text-orange-300" />
        </div>
        <p className="font-semibold text-gray-600">Aucune photo pour l&apos;instant</p>
        <p className="text-sm text-gray-400 mt-1">Les photos publiées apparaîtront ici.</p>
      </div>
    )
  }

  const current = selected !== null ? photos[selected] : null

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            onClick={() => open(i)}
            className="relative aspect-square overflow-hidden rounded-xl bg-orange-50 group"
          >
            <Image
              src={photo.url}
              alt=""
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 33vw, 200px"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center mt-3">
        {photos.length} photo{photos.length > 1 ? 's' : ''}
      </p>

      {/* Lightbox */}
      {selected !== null && current && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col"
          onClick={close}
        >
          {/* Top bar */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              {current.authorName && (
                <p className="text-white text-sm font-semibold">{current.authorName}</p>
              )}
              <p className="text-white/50 text-xs">
                {selected + 1} / {photos.length}
                {current.postDate && ` · ${timeAgo(current.postDate)}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadPhoto(current.url, selected)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Télécharger"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={close}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Image */}
          <div
            className="flex-1 relative flex items-center justify-center px-12"
            onClick={(e) => e.stopPropagation()}
          >
            {photos.length > 1 && (
              <button
                onClick={prev}
                className="absolute left-2 w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <div className="relative w-full h-full max-w-2xl">
              <Image
                src={current.url}
                alt=""
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>

            {photos.length > 1 && (
              <button
                onClick={next}
                className="absolute right-2 w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Thumbnail strip */}
          {photos.length > 1 && (
            <div
              className="flex gap-1.5 px-4 py-3 overflow-x-auto shrink-0 justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {photos.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(i)}
                  className={`relative w-12 h-12 shrink-0 rounded-lg overflow-hidden transition-all ${
                    i === selected ? 'ring-2 ring-white opacity-100' : 'opacity-50 hover:opacity-80'
                  }`}
                >
                  <Image src={p.url} alt="" fill className="object-cover" sizes="48px" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
