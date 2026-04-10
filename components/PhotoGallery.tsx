'use client'

import { useState, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { X, Download, ChevronLeft, ChevronRight, ImageOff, CalendarDays } from 'lucide-react'
import { Photo } from '@/types'

interface GalleryPhoto extends Photo {
  authorName?: string
  postDate?: string
}

interface PhotoGalleryProps {
  photos: GalleryPhoto[]
}

function toDateKey(dateStr?: string) {
  if (!dateStr) return ''
  return new Date(dateStr).toISOString().slice(0, 10) // YYYY-MM-DD
}

function formatDayLabel(dateKey: string) {
  const date = new Date(dateKey)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (toDateKey(today.toISOString()) === dateKey) return 'Aujourd\'hui'
  if (toDateKey(yesterday.toISOString()) === dateKey) return 'Hier'
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

function formatDayShort(dateKey: string) {
  const date = new Date(dateKey)
  return {
    day: date.toLocaleDateString('fr-FR', { day: 'numeric' }),
    month: date.toLocaleDateString('fr-FR', { month: 'short' }),
    weekday: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
  }
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
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<number | null>(null)

  // Dates uniques triées (plus récentes en premier)
  const dates = useMemo(() => {
    const keys = new Set(photos.map((p) => toDateKey(p.postDate)))
    return Array.from(keys).filter(Boolean).sort((a, b) => b.localeCompare(a))
  }, [photos])

  // Photos filtrées
  const filtered = useMemo(() => {
    if (!selectedDate) return photos
    return photos.filter((p) => toDateKey(p.postDate) === selectedDate)
  }, [photos, selectedDate])

  const openLightbox = (i: number) => setLightbox(i)
  const closeLightbox = () => setLightbox(null)
  const prevPhoto = useCallback(() => setLightbox((i) => i !== null ? (i - 1 + filtered.length) % filtered.length : null), [filtered.length])
  const nextPhoto = useCallback(() => setLightbox((i) => i !== null ? (i + 1) % filtered.length : null), [filtered.length])

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

  const current = lightbox !== null ? filtered[lightbox] : null

  return (
    <>
      {/* Calendrier / filtre par date */}
      {dates.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-semibold text-gray-600">Filtrer par date</span>
            {selectedDate && (
              <button
                onClick={() => setSelectedDate(null)}
                className="ml-auto text-xs text-orange-400 hover:text-orange-600 font-medium transition-colors"
              >
                Tout afficher
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {/* Pill "Toutes" */}
            <button
              onClick={() => setSelectedDate(null)}
              className={`flex flex-col items-center px-4 py-2.5 rounded-2xl shrink-0 transition-all border ${
                selectedDate === null
                  ? 'bg-gradient-to-b from-orange-400 to-rose-500 text-white border-transparent shadow-sm shadow-orange-200'
                  : 'bg-white text-gray-500 border-orange-100 hover:border-orange-300'
              }`}
            >
              <span className="text-lg font-bold leading-none">🗓</span>
              <span className="text-xs font-semibold mt-1">Toutes</span>
              <span className={`text-xs mt-0.5 ${selectedDate === null ? 'text-white/70' : 'text-gray-400'}`}>
                {photos.length}
              </span>
            </button>

            {/* Pill par date */}
            {dates.map((dateKey) => {
              const count = photos.filter((p) => toDateKey(p.postDate) === dateKey).length
              const { day, month, weekday } = formatDayShort(dateKey)
              const isSelected = selectedDate === dateKey
              return (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDate(dateKey)}
                  className={`flex flex-col items-center px-4 py-2.5 rounded-2xl shrink-0 transition-all border min-w-[64px] ${
                    isSelected
                      ? 'bg-gradient-to-b from-orange-400 to-rose-500 text-white border-transparent shadow-sm shadow-orange-200'
                      : 'bg-white text-gray-600 border-orange-100 hover:border-orange-300'
                  }`}
                >
                  <span className={`text-xs font-medium uppercase tracking-wide ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                    {weekday}
                  </span>
                  <span className="text-xl font-bold leading-tight">{day}</span>
                  <span className={`text-xs ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>{month}</span>
                  <span className={`text-xs font-semibold mt-0.5 px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-orange-50 text-orange-500'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Label date sélectionnée */}
          {selectedDate && (
            <p className="text-sm text-gray-500 mt-3 font-medium">
              📅 {formatDayLabel(selectedDate)} · {filtered.length} photo{filtered.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* Grille */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-orange-50">
          <p className="text-gray-400">Aucune photo ce jour-là</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
          {filtered.map((photo, i) => (
            <button
              key={photo.id}
              onClick={() => openLightbox(i)}
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
      )}

      <p className="text-xs text-gray-400 text-center mt-3">
        {filtered.length} photo{filtered.length > 1 ? 's' : ''}
        {selectedDate ? ` le ${formatDayLabel(selectedDate)}` : ' au total'}
      </p>

      {/* Lightbox */}
      {lightbox !== null && current && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" onClick={closeLightbox}>
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0" onClick={(e) => e.stopPropagation()}>
            <div>
              {current.authorName && (
                <p className="text-white text-sm font-semibold">{current.authorName}</p>
              )}
              <p className="text-white/50 text-xs">
                {lightbox + 1} / {filtered.length}
                {current.postDate && ` · ${formatDayLabel(toDateKey(current.postDate))}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadPhoto(current.url, lightbox)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Télécharger"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={closeLightbox}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Image */}
          <div className="flex-1 relative flex items-center justify-center px-12" onClick={(e) => e.stopPropagation()}>
            {filtered.length > 1 && (
              <button onClick={prevPhoto}
                className="absolute left-2 w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors z-10">
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            <div className="relative w-full h-full max-w-2xl">
              <Image src={current.url} alt="" fill className="object-contain" sizes="100vw" priority />
            </div>
            {filtered.length > 1 && (
              <button onClick={nextPhoto}
                className="absolute right-2 w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors z-10">
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Miniatures */}
          {filtered.length > 1 && (
            <div className="flex gap-1.5 px-4 py-3 overflow-x-auto shrink-0 justify-center" onClick={(e) => e.stopPropagation()}>
              {filtered.map((p, i) => (
                <button key={p.id} onClick={() => setLightbox(i)}
                  className={`relative w-12 h-12 shrink-0 rounded-lg overflow-hidden transition-all ${
                    i === lightbox ? 'ring-2 ring-white opacity-100' : 'opacity-50 hover:opacity-80'
                  }`}>
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
