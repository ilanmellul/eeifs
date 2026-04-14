import { createClient } from '@/lib/supabase/server'
import { getPosts } from '@/lib/actions/posts'
import { getAlbums } from '@/lib/actions/albums'
import { getCampInfo } from '@/lib/actions/camp-info'
import { notFound } from 'next/navigation'
import CampFeed from '@/components/CampFeed'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CampPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: camp }, { data: { user } }, posts, albums, campInfo] = await Promise.all([
    supabase.from('camps').select('*').eq('id', id).single(),
    supabase.auth.getUser(),
    getPosts(id),
    getAlbums(id),
    getCampInfo(id),
  ])

  if (!camp) notFound()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, role, created_at, avatar_url')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      <CampFeed
        camp={camp}
        posts={posts}
        campId={id}
        currentUserId={user?.id}
        userProfile={profile}
        initialAlbums={albums}
        campInfo={campInfo}
      />
    </main>
  )
}
