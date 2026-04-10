import { createClient } from '@/lib/supabase/client'

// Returns the storage path (not a public URL) — bucket must be private
export async function uploadPhoto(file: File): Promise<string | null> {
  const supabase = createClient()
  const ext = file.name.split('.').pop()
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from('photosre')
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (error) {
    console.error('Upload error:', error)
    return null
  }

  // Return the path, not a public URL
  return path
}
