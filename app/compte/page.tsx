import { createClient } from '@/lib/supabase/server'
import { getMyPosts, deletePost } from '@/lib/actions/posts'
import { redirect } from 'next/navigation'
import { Trash2, Camera, Info, CalendarDays, Shield, Tent } from 'lucide-react'
import { PostType } from '@/types'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Hier'
  return `Il y a ${days}j`
}

export default async function ComptePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, posts] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    getMyPosts(user.id),
  ])

  if (!profile) redirect('/login')

  const nbCamps = new Set(posts.map((p) => p.camp_id)).size

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-5">

      {/* Hero profile card */}
      <div className={`rounded-3xl p-6 text-white shadow-lg ${
        profile.role === 'admin'    ? 'bg-gradient-to-br from-rose-500 to-purple-600'
        : profile.role === 'animateur' ? 'bg-gradient-to-br from-orange-400 to-rose-500'
        :                               'bg-gradient-to-br from-sky-400 to-blue-500'
      }`}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-inner border border-white/30">
            <span className="text-white text-2xl font-bold">
              {profile.name?.[0]?.toUpperCase() ?? '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold truncate">{profile.name}</h1>
              {profile.role === 'admin' && <Shield className="w-4 h-4 shrink-0" />}
            </div>
            <p className="text-white/70 text-sm mt-0.5">{user.email}</p>
            <span className="inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full bg-white/20 border border-white/30">
              {profile.role === 'admin' ? '🛡️ Administrateur'
               : profile.role === 'animateur' ? '🎯 Animateur'
               : '👨‍👩‍👧 Parent'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="bg-white/15 rounded-2xl p-3 text-center border border-white/20">
            <p className="text-2xl font-bold">{posts.length}</p>
            <p className="text-xs text-white/70 mt-0.5">Publication{posts.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="bg-white/15 rounded-2xl p-3 text-center border border-white/20">
            <p className="text-2xl font-bold">{nbCamps}</p>
            <p className="text-xs text-white/70 mt-0.5">Camp{nbCamps !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div>
        <h2 className="font-bold text-gray-700 mb-3 px-1">Mes publications</h2>

        {posts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-orange-50">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-gray-400 font-medium">Aucune publication pour le moment</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => {
              const campName = (post as { camps?: { name: string } }).camps?.name ?? 'Camp'
              return (
                <div key={post.id} className="bg-white rounded-2xl border border-orange-50 shadow-sm overflow-hidden">
                  <div className="flex items-stretch">
                    {/* Left accent */}
                    <div className={`w-1.5 shrink-0 ${
                      post.type === 'photo'     ? 'bg-violet-400'
                      : post.type === 'info'    ? 'bg-sky-400'
                      :                          'bg-amber-400'
                    }`} />

                    <div className="flex items-center gap-3 p-4 flex-1 min-w-0">
                      {/* Icon */}
                      {post.type === 'photo' && (
                        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                          <Camera className="w-5 h-5 text-violet-600" />
                        </div>
                      )}
                      {post.type === 'info' && (
                        <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                          <Info className="w-5 h-5 text-sky-600" />
                        </div>
                      )}
                      {post.type === 'programme' && (
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                          <CalendarDays className="w-5 h-5 text-amber-600" />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                            <Tent className="w-3 h-3" /> {campName}
                          </span>
                          {post.type === 'photo' && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-600">Photo</span>
                          )}
                          {post.type === 'info' && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-sky-100 text-sky-600">Info</span>
                          )}
                          {post.type === 'programme' && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">Programme</span>
                          )}
                        </div>
                        {post.content ? (
                          <p className="text-sm text-gray-800 font-medium truncate">{post.content}</p>
                        ) : (
                          <p className="text-sm text-gray-400">
                            {post.photos?.length ?? 0} photo{(post.photos?.length ?? 0) > 1 ? 's' : ''}
                          </p>
                        )}
                        <p className="text-xs text-gray-300 mt-1">{timeAgo(post.created_at)}</p>
                      </div>

                      {/* Delete */}
                      <form action={async () => { 'use server'; await deletePost(post.id) }}>
                        <button type="submit" title="Supprimer"
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-500 transition-all hover:scale-105 active:scale-95 shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
