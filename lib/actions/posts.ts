'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { PostType } from '@/types'
import { resolveSignedUrls } from './storage'

export async function createPost(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const camp_id = formData.get('camp_id') as string
  const type = formData.get('type') as PostType
  const content = formData.get('content') as string
  const photoUrls = formData.getAll('photo_urls') as string[]

  const { data: post, error } = await supabase
    .from('posts')
    .insert({ camp_id, user_id: user.id, type, content })
    .select()
    .single()

  if (error) return { error: error.message }

  if (photoUrls.length > 0) {
    const photos = photoUrls.map((url) => ({ post_id: post.id, url }))
    await supabase.from('photos').insert(photos)
  }

  revalidatePath(`/camp/${camp_id}`)
  return { success: true, post }
}

const POSTS_PER_PAGE = 20

export async function getPosts(campId: string, page = 0) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles (id, name, role, avatar_url),
      photos (*),
      comments (*, profiles (id, name, role))
    `)
    .eq('camp_id', campId)
    .order('created_at', { ascending: false })
    .range(page * POSTS_PER_PAGE, (page + 1) * POSTS_PER_PAGE - 1)

  if (error || !data) return []

  // Resolve signed URLs for all photos (bucket is private)
  const allPaths = data.flatMap((post) => (post.photos ?? []).map((p: { url: string }) => p.url))
  const signedUrls = await resolveSignedUrls(allPaths)

  return data.map((post) => ({
    ...post,
    photos: (post.photos ?? []).map((photo: { id: string; post_id: string; url: string; created_at: string }) => ({
      ...photo,
      url: signedUrls[photo.url] ?? photo.url,
    })),
  }))
}

export async function getCamps() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('camps')
    .select('*')
    .order('date_start', { ascending: true })
  return data ?? []
}

export async function deletePost(postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: post } = await supabase.from('posts').select('camp_id').eq('id', postId).single()
  const { error } = await supabase.from('posts').delete().eq('id', postId)
  if (error) return { error: error.message }

  if (post?.camp_id) revalidatePath(`/camp/${post.camp_id}`)
  revalidatePath('/compte')
  return { success: true }
}

export async function getMyPosts(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('posts')
    .select(`*, photos (*), camps (name)`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function createCamp(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const date_start = formData.get('date_start') as string
  const date_end = formData.get('date_end') as string

  const { data, error } = await supabase
    .from('camps')
    .insert({ name, date_start, date_end })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true, camp: data }
}
