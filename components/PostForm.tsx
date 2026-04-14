'use client'

import { useState, useTransition, useRef, useCallback } from 'react'
import { createPost } from '@/lib/actions/posts'
import { uploadPhoto } from '@/lib/actions/upload'
import { Button } from './ui/Button'
import { PostType } from '@/types'
import { Camera, Info, CalendarDays, X, ImagePlus } from 'lucide-react'

interface PostFormProps {
  campId: string
  onSuccess?: () => void
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 Mo
const MAX_PHOTOS = 10

async function compressImage(file: File): Promise<File> {
  const MAX_WIDTH = 1200
  const QUALITY = 0.82
  return new Promise((resolve) => {
    const img = new window.Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(file); return }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
            type: 'image/jpeg',
            lastModified: Date.now(),
          }))
        },
        'image/jpeg',
        QUALITY,
      )
    }
    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file) }
    img.src = objectUrl
  })
}

const POST_TYPES: { value: PostType; label: string; icon: React.ReactNode }[] = [
  { value: 'info', label: 'Info', icon: <Info className="w-4 h-4" /> },
  { value: 'photo', label: 'Photo', icon: <Camera className="w-4 h-4" /> },
  { value: 'programme', label: 'Programme', icon: <CalendarDays className="w-4 h-4" /> },
]

export default function PostForm({ campId, onSuccess }: PostFormProps) {
  const [type, setType] = useState<PostType>('info')

  function changeType(newType: PostType) {
    setType(newType)
    if (newType !== 'photo') {
      previews.forEach(({ url }) => URL.revokeObjectURL(url))
      setPreviews([])
    }
  }
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([])
  const [isPending, startTransition] = useTransition()
  const [compressing, setCompressing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? [])
    if (fileInputRef.current) fileInputRef.current.value = ''

    const remaining = MAX_PHOTOS - previews.length
    const accepted: File[] = []

    for (const file of incoming) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`${file.name} : format non supporté (JPEG, PNG ou WebP uniquement)`)
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`${file.name} : dépasse la limite de 5 Mo`)
        return
      }
      if (accepted.length >= remaining) {
        setError(`Maximum ${MAX_PHOTOS} photos par post`)
        break
      }
      accepted.push(file)
    }

    if (accepted.length === 0) return
    setError(null)
    setCompressing(true)

    const compressed = await Promise.all(accepted.map(compressImage))
    const newPreviews = compressed.map((file) => ({ file, url: URL.createObjectURL(file) }))
    setPreviews((prev) => [...prev, ...newPreviews])
    setCompressing(false)
  }, [previews.length])

  function removePhoto(index: number) {
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index].url)
      return prev.filter((_, i) => i !== index)
    })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    formData.set('camp_id', campId)
    formData.set('type', type)

    startTransition(async () => {
      // Upload photos first
      const uploadedUrls: string[] = []
      for (const { file } of previews) {
        const url = await uploadPhoto(file)
        if (url) uploadedUrls.push(url)
      }

      uploadedUrls.forEach((url) => formData.append('photo_urls', url))

      const result = await createPost(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setPreviews([])
        formRef.current?.reset()
        setTimeout(() => {
          setSuccess(false)
          onSuccess?.()
        }, 1500)
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="bg-white rounded-3xl border border-orange-50 shadow-sm shadow-orange-100 p-5 space-y-4">
      <h3 className="font-bold text-gray-900">Nouveau post</h3>

      {/* Type selector */}
      <div className="flex gap-2">
        {POST_TYPES.map(({ value, label, icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => changeType(value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
              type === value
                ? 'bg-gradient-to-r from-orange-400 to-rose-500 text-white shadow-sm shadow-orange-200'
                : 'bg-orange-50 text-orange-400 border border-orange-100 hover:bg-orange-100'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <textarea
        name="content"
        placeholder={
          type === 'info' ? 'Partagez une information...'
          : type === 'programme' ? 'Décrivez le programme...'
          : 'Ajoutez une description (optionnel)'
        }
        rows={3}
        className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent text-sm resize-none placeholder:text-gray-300 bg-orange-50/40"
      />

      {/* Photo upload — uniquement si type photo */}
      {type === 'photo' && <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => { handleFiles(e).catch(() => setError('Erreur lors du chargement des photos')) }}
          className="hidden"
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={compressing || previews.length >= MAX_PHOTOS}
            className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-500 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ImagePlus className="w-4 h-4" />
            Ajouter des photos
          </button>
          {compressing && (
            <span className="text-xs text-gray-400 animate-pulse">Compression en cours…</span>
          )}
          {previews.length > 0 && !compressing && (
            <span className="text-xs text-gray-400">{previews.length}/{MAX_PHOTOS}</span>
          )}
        </div>

        {previews.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {previews.map(({ url }, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>}

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
          Post publié avec succès !
        </p>
      )}

      <Button type="submit" loading={isPending} className="w-full">
        Publier
      </Button>
    </form>
  )
}
