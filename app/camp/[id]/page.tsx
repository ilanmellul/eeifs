import { createClient } from '@/lib/supabase/server'
import { getPosts } from '@/lib/actions/posts'
import { notFound } from 'next/navigation'
import CampFeed from '@/components/CampFeed'
import { Calendar } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function CampPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: camp }, { data: { user } }, posts] = await Promise.all([
    supabase.from('camps').select('*').eq('id', id).single(),
    supabase.auth.getUser(),
    getPosts(id),
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
    <main className="max-w-xl mx-auto px-4 py-6">
      {/* Camp header */}
      <div className="mb-6 pb-6 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">{camp.name}</h1>
        <div className="flex items-center gap-1.5 mt-1.5 text-sm text-gray-400">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formatDate(camp.date_start)} → {formatDate(camp.date_end)}</span>
        </div>
      </div>

      <CampFeed
        posts={posts}
        campId={id}
        currentUserId={user?.id}
        userProfile={profile}
      />
    </main>
  )
}
