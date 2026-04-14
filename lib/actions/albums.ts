'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Album } from '@/types'

export async function getAlbums(campId: string): Promise<Album[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('albums')
    .select('*')
    .eq('camp_id', campId)
    .order('created_at', { ascending: true })
  return data ?? []
}

export async function createAlbum(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'admin' && profile.role !== 'animateur')) {
    return { error: 'Non autorisé' }
  }

  const camp_id = formData.get('camp_id') as string
  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Le nom de l\'album est requis' }

  const { data, error } = await supabase
    .from('albums')
    .insert({ camp_id, user_id: user.id, name })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/camp/${camp_id}`)
  return { success: true, album: data }
}

export async function deleteAlbum(albumId: string, campId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: album } = await supabase
    .from('albums')
    .select('user_id')
    .eq('id', albumId)
    .single()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!album) return { error: 'Album introuvable' }
  const isAdmin = profile?.role === 'admin'
  const isOwner = album.user_id === user.id
  if (!isAdmin && !isOwner) return { error: 'Non autorisé' }

  // Les posts de cet album passent à null (Wall) grâce au ON DELETE SET NULL
  const { error } = await supabase.from('albums').delete().eq('id', albumId)
  if (error) return { error: error.message }

  revalidatePath(`/camp/${campId}`)
  return { success: true }
}
