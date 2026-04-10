import { createClient } from '@/lib/supabase/server'
import { getCamps, createCamp } from '@/lib/actions/posts'
import { redirect } from 'next/navigation'
import PostForm from '@/components/PostForm'
import CampCard from '@/components/CampCard'
import { PlusCircle } from 'lucide-react'

async function handleCreateCamp(formData: FormData): Promise<void> {
  'use server'
  await createCamp(formData)
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

  const camps = await getCamps()

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard admin</h1>
        <p className="text-gray-500 mt-1">Gérez les camps et publiez du contenu.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Camps */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-800">Camps</h2>

          {/* Create camp form */}
          <form action={handleCreateCamp} className="bg-white rounded-3xl border border-orange-50 shadow-sm p-5 space-y-3">
            <h3 className="font-semibold text-gray-700">Créer un camp</h3>
            <input
              name="name"
              type="text"
              required
              placeholder="Nom du camp"
              className="w-full px-4 py-2.5 rounded-xl border border-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm bg-orange-50/30"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Début</label>
                <input
                  name="date_start"
                  type="date"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fin</label>
                <input
                  name="date_end"
                  type="date"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-orange-400 to-rose-500 text-white shadow-sm hover:from-orange-500 hover:to-rose-600 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              Créer le camp
            </button>
          </form>

          {/* Camp list */}
          {camps.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Aucun camp créé</p>
          ) : (
            <div className="space-y-2">
              {camps.map((camp) => (
                <CampCard key={camp.id} camp={camp} />
              ))}
            </div>
          )}
        </div>

        {/* Right: Post form */}
        <div>
          <h2 className="font-semibold text-gray-800 mb-4">Publier du contenu</h2>
          {camps.length === 0 ? (
            <div className="bg-orange-50 rounded-3xl border border-dashed border-orange-200 p-8 text-center">
              <p className="text-sm text-orange-400">Créez d&apos;abord un camp pour pouvoir publier.</p>
            </div>
          ) : (
            <PostForm campId={camps[0].id} />
          )}
        </div>
      </div>
    </main>
  )
}
