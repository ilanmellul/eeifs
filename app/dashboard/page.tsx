import { createClient } from '@/lib/supabase/server'
import { getCamps, createCamp } from '@/lib/actions/posts'
import { redirect } from 'next/navigation'
import PostForm from '@/components/PostForm'
import CampCard from '@/components/CampCard'
import { Button } from '@/components/ui/Button'
import { PlusCircle } from 'lucide-react'

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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard animateur</h1>
        <p className="text-gray-500 mt-1">Gérez vos camps et publiez du contenu.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Camps */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Camps</h2>
          </div>

          {/* Create camp form */}
          <form action={createCamp} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <h3 className="font-medium text-gray-700 text-sm">Créer un camp</h3>
            <input
              name="name"
              type="text"
              required
              placeholder="Nom du camp"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Début</label>
                <input
                  name="date_start"
                  type="date"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fin</label>
                <input
                  name="date_end"
                  type="date"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                />
              </div>
            </div>
            <Button type="submit" variant="secondary" size="sm" className="w-full">
              <PlusCircle className="w-4 h-4" />
              Créer le camp
            </Button>
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
            <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-8 text-center">
              <p className="text-sm text-gray-400">Créez d&apos;abord un camp pour pouvoir publier.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Camp cible
                </label>
                <select
                  form="post-form"
                  name="camp_id"
                  id="camp-select"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm bg-white"
                  defaultValue={camps[0].id}
                >
                  {camps.map((camp) => (
                    <option key={camp.id} value={camp.id}>{camp.name}</option>
                  ))}
                </select>
              </div>
              <PostForm campId={camps[0].id} />
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
