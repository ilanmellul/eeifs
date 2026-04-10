'use server'

import { createClient } from '@/lib/supabase/server'

const SIGNED_URL_EXPIRY = 60 * 60 * 24 // 24h
const BATCH_SIZE = 50 // max paths par appel Supabase

// Batch avec chunking pour éviter les crashs sur beaucoup de photos
export async function resolveSignedUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {}
  const supabase = await createClient()

  const result: Record<string, string> = {}

  // Découper en chunks de 50
  for (let i = 0; i < paths.length; i += BATCH_SIZE) {
    const chunk = paths.slice(i, i + BATCH_SIZE)
    const { data, error } = await supabase.storage
      .from('photosre')
      .createSignedUrls(chunk, SIGNED_URL_EXPIRY)

    if (error || !data) continue

    data
      .filter((item) => item.signedUrl && item.path)
      .forEach((item) => { result[item.path!] = item.signedUrl! })
  }

  return result
}
