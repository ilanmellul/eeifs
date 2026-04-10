'use client'

import { useState, useTransition, useRef } from 'react'
import { createPost } from '@/lib/actions/posts'
import { uploadPhoto } from '@/lib/actions/upload'
import { Button } from './ui/Button'
import { PostType } from '@/types'
import { Camera, Info, CalendarDays, X, ImagePlus } from 'lucide-react'

interface PostFormProps {
  campId: string
  onSuccess?: () => void
}

const POST_TYPES: { value: PostType; label: string; icon: React.ReactNode }[] = [
  { value: 'info', label: 'Info', icon: <Info className="w-4 h-4" /> },
  { value: 'photo', label: 'Photo', icon: <Camera className="w-4 h-4" /> },
  { value: 'programme', label: 'Programme', icon: <CalendarDays className="w-4 h-4" /> },
]

export default function PostForm({ campId, onSuccess }: PostFormProps) {
  const [type, setType] = useState<PostType>('info')
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([])
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const newPreviews = files.map((file) => ({ file, url: URL.createObjectURL(file) }))
    setPreviews((prev) => [...prev, ...newPreviews])
  }

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
            onClick={() => setType(value)}
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

      {/* Photo upload */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFiles}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-500 font-medium transition-colors"
        >
          <ImagePlus className="w-4 h-4" />
          Ajouter des photos
        </button>

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
      </div>

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
