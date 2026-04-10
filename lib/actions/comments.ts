'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addComment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const post_id = formData.get('post_id') as string
  const camp_id = formData.get('camp_id') as string
  const content = formData.get('content') as string

  if (!content.trim()) return { error: 'Commentaire vide' }

  const { error } = await supabase
    .from('comments')
    .insert({ post_id, user_id: user.id, content })

  if (error) return { error: error.message }

  revalidatePath(`/camp/${camp_id}`)
  return { success: true }
}
