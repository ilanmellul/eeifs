'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ReactionEmoji } from '@/types'

const VALID_EMOJIS: ReactionEmoji[] = ['❤️', '😂', '🔥', '👏']

export async function toggleReaction(postId: string, emoji: ReactionEmoji, campId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  if (!VALID_EMOJIS.includes(emoji)) return { error: 'Emoji non valide' }

  const { data: existing } = await supabase
    .from('reactions')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .eq('emoji', emoji)
    .maybeSingle()

  if (existing) {
    await supabase.from('reactions').delete().eq('id', existing.id)
  } else {
    await supabase.from('reactions').insert({ post_id: postId, user_id: user.id, emoji })
  }

  revalidatePath(`/camp/${campId}`)
  return { success: true, added: !existing }
}
