'use server'

import { createClient } from '@/lib/supabase/server'

// Generate a signed URL valid for 1 hour
export async function getSignedUrl(path: string): Promise<string | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from('photosre')
    .createSignedUrl(path, 3600)

  if (error) return null
  return data.signedUrl
}

// Batch: resolve signed URLs for multiple paths
export async function resolveSignedUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {}
  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from('photosre')
    .createSignedUrls(paths, 3600)

  if (error || !data) return {}

  return Object.fromEntries(
    data
      .filter((item) => item.signedUrl)
      .map((item) => [item.path, item.signedUrl])
  )
}
