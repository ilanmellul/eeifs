'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
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

const PAGE_SIZE = 24

function toDateKey(dateStr?: string) {
  if (!dateStr) return ''
  return new Date(dateStr).toISOString().slice(0, 10)
}

function formatDayLabel(dateKey: string) {
  const date = new Date(dateKey)
  const todayKey = toDateKey(new Date().toISOString())
  const yesterdayDate = new Date(); yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterdayKey = toDateKey(yesterdayDate.toISOString())
  if (dateKey === todayKey) return "Aujourd'hui"
  if (dateKey === yesterdayKey) return 'Hier'
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
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

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return (day + 6) % 7
}

function Calendar({
  photoDates,
  selectedDate,
  onSelect,
  onClose,
}: {
  photoDates: Set<string>
  selectedDate: string | null
  onSelect: (date: string | null) => void
  onClose: () => void
}) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [onClose])

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)
  const todayKey = toDateKey(today.toISOString())

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div
      ref={ref}
      className="absolute top-12 left-0 z-30 bg-white rounded-2xl shadow-xl border border-orange-100 p-4 w-72"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-orange-50 text-gray-500 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold text-gray-800">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-orange-50 text-gray-500 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />
          const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const hasPhotos = photoDates.has(dateKey)
          const isSelected = selectedDate === dateKey
          const isToday = dateKey === todayKey

          return (
            <button
              key={dateKey}
              disabled={!hasPhotos}
              onClick={() => { onSelect(isSelected ? null : dateKey); onClose() }}
              className={`
                relative flex flex-col items-center justify-center h-9 w-full rounded-xl text-sm font-medium transition-all
                ${isSelected ? 'bg-gradient-to-b from-orange-400 to-rose-500 text-white shadow-sm' : ''}
                ${!isSelected && hasPhotos ? 'hover:bg-green-50 text-gray-800 cursor-pointer' : ''}
                ${!isSelected && !hasPhotos ? 'text-gray-300 cursor-default' : ''}
                ${isToday && !isSelected ? 'ring-1 ring-orange-300' : ''}
              `}
            >
              {day}
              {hasPhotos && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
              )}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Photos disponibles</span>
        {selectedDate && (
          <button onClick={() => { onSelect(null); onClose() }} className="ml-auto text-orange-400 hover:text-orange-600 font-medium">
            Réinitialiser
          </button>
        )}
      </div>
    </div>
  )
}

// Miniature lazy : ne charge l'image que quand elle devient visible à l'écran
function LazyThumbnail({
  photo,
  index,
  isActive,
  onClick,
}: {
  photo: GalleryPhoto
  index: number
  isActive: boolean
  onClick: () => void
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true) },
      { threshold: 0, rootMargin: '0px 200px 0px 200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <button
      ref={ref}
      onClick={onClick}
      aria-label={`Photo ${index + 1}`}
      className={`relative w-12 h-12 shrink-0 rounded-lg overflow-hidden transition-all ${
        isActive ? 'ring-2 ring-white opacity-100' : 'opacity-50 hover:opacity-80'
      }`}
    >
      {isVisible ? (
        <Image src={photo.url} alt="" fill className="object-cover" sizes="48px" />
      ) : (
        <div className="w-full h-full bg-white/10" />
      )}
    </button>
  )
}

export default function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const photoDates = useMemo(() => new Set(photos.map((p) => toDateKey(p.postDate)).filter(Boolean)), [photos])

  const filtered = useMemo(() => {
    if (!selectedDate) return photos
    return photos.filter((p) => toDateKey(p.postDate) === selectedDate)
  }, [photos, selectedDate])

  // Reset pagination quand le filtre de date change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [selectedDate])

  // Keyboard navigation dans le lightbox
  useEffect(() => {
    if (lightbox === null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') prevPhoto()
      else if (e.key === 'ArrowRight') nextPhoto()
      else if (e.key === 'Escape') closeLightbox()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Scroll la miniature active dans la bande du lightbox
  useEffect(() => {
    if (lightbox === null) return
    const strip = document.getElementById('lightbox-strip')
    const thumb = strip?.children[lightbox] as HTMLElement | undefined
    thumb?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [lightbox])

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
  const visiblePhotos = filtered.slice(0, visibleCount)

  return (
    <>
      {/* Barre supérieure */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {selectedDate
            ? <><span className="font-semibold text-gray-800">{formatDayLabel(selectedDate)}</span> · {filtered.length} photo{filtered.length > 1 ? 's' : ''}</>
            : <><span className="font-semibold text-gray-800">{photos.length}</span> photo{photos.length > 1 ? 's' : ''}</>
          }
        </p>

        <div className="relative">
          <button
            onClick={() => setCalendarOpen((o) => !o)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${
              calendarOpen || selectedDate
                ? 'bg-gradient-to-r from-orange-400 to-rose-500 text-white border-transparent shadow-sm'
                : 'bg-white text-gray-600 border-orange-100 hover:border-orange-300'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            {selectedDate ? formatDayLabel(selectedDate) : 'Filtrer'}
            {selectedDate && (
              <span onClick={(e) => { e.stopPropagation(); setSelectedDate(null) }} className="ml-1 hover:opacity-70">
                <X className="w-3 h-3" />
              </span>
            )}
          </button>

          {calendarOpen && (
            <Calendar
              photoDates={photoDates}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
              onClose={() => setCalendarOpen(false)}
            />
          )}
        </div>
      </div>

      {/* Grille */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-orange-50">
          <p className="text-gray-400">Aucune photo ce jour-là</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
            {visiblePhotos.map((photo, i) => (
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

          {visibleCount < filtered.length && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-white border border-orange-100 text-orange-500 hover:bg-orange-50 transition-all"
              >
                Charger plus ({filtered.length - visibleCount} restante{filtered.length - visibleCount > 1 ? 's' : ''})
              </button>
            </div>
          )}
        </>
      )}

      {/* Lightbox */}
      {lightbox !== null && current && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" onClick={closeLightbox}>
          <div className="flex items-center justify-between px-4 py-3 shrink-0" onClick={(e) => e.stopPropagation()}>
            <div>
              {current.authorName && <p className="text-white text-sm font-semibold">{current.authorName}</p>}
              <p className="text-white/50 text-xs">
                {lightbox + 1} / {filtered.length}
                {current.postDate && ` · ${formatDayLabel(toDateKey(current.postDate))}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadPhoto(current.url, lightbox)}
                aria-label="Télécharger"
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={closeLightbox}
                aria-label="Fermer"
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 relative flex items-center justify-center px-12" onClick={(e) => e.stopPropagation()}>
            {filtered.length > 1 && (
              <button onClick={prevPhoto} aria-label="Photo précédente" className="absolute left-2 w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors z-10">
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            <div className="relative w-full h-full max-w-2xl">
              <Image src={current.url} alt="" fill className="object-contain" sizes="100vw" priority />
            </div>
            {filtered.length > 1 && (
              <button onClick={nextPhoto} aria-label="Photo suivante" className="absolute right-2 w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors z-10">
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {filtered.length > 1 && (
            <div
              id="lightbox-strip"
              className="flex gap-1.5 px-4 py-3 overflow-x-auto shrink-0 justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {filtered.map((p, i) => (
                <LazyThumbnail
                  key={p.id}
                  photo={p}
                  index={i}
                  isActive={i === lightbox}
                  onClick={() => setLightbox(i)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
