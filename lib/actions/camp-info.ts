'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { CampInfo } from '@/types'

export async function getCampInfo(campId: string): Promise<CampInfo | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('camp_info')
    .select('*')
    .eq('camp_id', campId)
    .maybeSingle()
  return data ?? null
}

export async function saveCampInfo(campId: string, formData: FormData) {
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

  const payload = {
    camp_id: campId,
    address:           (formData.get('address') as string) || null,
    phone:             (formData.get('phone') as string) || null,
    email:             (formData.get('email') as string) || null,
    director:          (formData.get('director') as string) || null,
    arrival_time:      (formData.get('arrival_time') as string) || null,
    departure_time:    (formData.get('departure_time') as string) || null,
    meeting_point:     (formData.get('meeting_point') as string) || null,
    what_to_bring:     (formData.get('what_to_bring') as string) || null,
    emergency_contact: (formData.get('emergency_contact') as string) || null,
    extra_info:        (formData.get('extra_info') as string) || null,
    updated_at:        new Date().toISOString(),
    updated_by:        user.id,
  }

  const { error } = await supabase
    .from('camp_info')
    .upsert(payload, { onConflict: 'camp_id' })

  if (error) return { error: error.message }

  revalidatePath(`/camp/${campId}`)
  return { success: true }
}
