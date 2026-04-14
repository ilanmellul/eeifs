import { createClient } from '@/lib/supabase/server'
import { getCamps, createCamp } from '@/lib/actions/posts'
import { getAlbums } from '@/lib/actions/albums'
import { redirect } from 'next/navigation'
import PostForm from '@/components/PostForm'
import CampCard from '@/components/CampCard'
import { PlusCircle, Users, Shield, UserRound, Tent } from 'lucide-react'

async function handleCreateCamp(formData: FormData): Promise<void> {
  'use server'
  await createCamp(formData)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  const [camps, { data: users }] = await Promise.all([
    getCamps(),
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
  ])

  const firstCampAlbums = camps.length > 0 ? await getAlbums(camps[0].id) : []

  const parents    = users?.filter((u) => u.role === 'parent') ?? []
  const animateurs = users?.filter((u) => u.role === 'animateur') ?? []
  const admins     = users?.filter((u) => u.role === 'admin') ?? []

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-500 to-purple-600 rounded-3xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5" />
          <span className="text-rose-200 text-sm font-medium">Administration</span>
        </div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-3 mt-4 flex-wrap">
          <span className="bg-white/15 px-3 py-1 rounded-full text-sm">{camps.length} camp{camps.length !== 1 ? 's' : ''}</span>
          <span className="bg-white/15 px-3 py-1 rounded-full text-sm">{users?.length ?? 0} inscrits</span>
          <span className="bg-white/15 px-3 py-1 rounded-full text-sm">{parents.length} parents</span>
        </div>
      </div>

      {/* Camps + Publier */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <Tent className="w-4 h-4 text-orange-400" /> Camps
          </h2>

          <form action={handleCreateCamp} className="bg-white rounded-3xl border border-orange-50 shadow-sm p-5 space-y-3">
            <h3 className="font-semibold text-gray-700">Créer un camp</h3>
            <input name="name" type="text" required placeholder="Nom du camp"
              className="w-full px-4 py-2.5 rounded-xl border border-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm bg-orange-50/30" />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Début</label>
                <input name="date_start" type="date" required
                  className="w-full px-3 py-2 rounded-xl border border-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fin</label>
                <input name="date_end" type="date" required
                  className="w-full px-3 py-2 rounded-xl border border-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm" />
              </div>
            </div>
            <button type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-orange-400 to-rose-500 text-white shadow-sm hover:from-orange-500 hover:to-rose-600 transition-all">
              <PlusCircle className="w-4 h-4" /> Créer le camp
            </button>
          </form>

          {camps.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Aucun camp créé</p>
          ) : (
            <div className="space-y-2">
              {camps.map((camp) => <CampCard key={camp.id} camp={camp} />)}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-bold text-gray-800 mb-4">Publier du contenu</h2>
          {camps.length === 0 ? (
            <div className="bg-orange-50 rounded-3xl border border-dashed border-orange-200 p-8 text-center">
              <p className="text-sm text-orange-400">Créez d&apos;abord un camp pour pouvoir publier.</p>
            </div>
          ) : (
            <PostForm campId={camps[0].id} albums={firstCampAlbums} />
          )}
        </div>
      </div>

      {/* Users */}
      <div>
        <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-rose-400" /> Inscrits ({users?.length ?? 0})
        </h2>

        <div className="bg-white rounded-3xl border border-orange-50 shadow-sm overflow-hidden">
          {!users || users.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucun inscrit</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {users.map((u) => (
                <div key={u.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-orange-50/50 transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    u.role === 'admin'     ? 'bg-gradient-to-br from-rose-500 to-purple-600'
                    : u.role === 'animateur' ? 'bg-gradient-to-br from-orange-400 to-rose-500'
                    :                         'bg-gradient-to-br from-sky-400 to-blue-500'
                  }`}>
                    <span className="text-white text-sm font-bold">
                      {u.name?.[0]?.toUpperCase() ?? '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{u.name}</p>
                    <p className="text-xs text-gray-400">Inscrit le {formatDate(u.created_at)}</p>
                  </div>
                  {u.role === 'admin' && (
                    <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-600 shrink-0">
                      <Shield className="w-3 h-3" /> Admin
                    </span>
                  )}
                  {u.role === 'animateur' && (
                    <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-orange-600 shrink-0">
                      <UserRound className="w-3 h-3" /> Animateur
                    </span>
                  )}
                  {u.role === 'parent' && (
                    <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-100 text-sky-600 shrink-0">
                      <UserRound className="w-3 h-3" /> Parent
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="rounded-2xl border p-3 text-center bg-sky-50 border-sky-100">
            <p className="text-xl font-bold text-sky-500">{parents.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Parents</p>
          </div>
          <div className="rounded-2xl border p-3 text-center bg-orange-50 border-orange-100">
            <p className="text-xl font-bold text-orange-500">{animateurs.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Animateurs</p>
          </div>
          <div className="rounded-2xl border p-3 text-center bg-rose-50 border-rose-100">
            <p className="text-xl font-bold text-rose-500">{admins.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Admins</p>
          </div>
        </div>
      </div>
    </main>
  )
}
