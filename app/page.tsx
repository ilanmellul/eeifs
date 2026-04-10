import { getCamps } from '@/lib/actions/posts'
import { createClient } from '@/lib/supabase/server'
import CampCard from '@/components/CampCard'

export default async function HomePage() {
  const [camps, supabase] = await Promise.all([
    getCamps(),
    createClient(),
  ])

  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('name, role')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-orange-400 to-rose-500 rounded-3xl p-6 mb-8 text-white shadow-lg shadow-orange-200">
        <p className="text-orange-100 text-sm font-medium mb-1">Bonjour 👋</p>
        <h1 className="text-2xl font-bold">
          {profile?.name ? profile.name : 'Bienvenue !'}
        </h1>
        <p className="text-orange-100 text-sm mt-1">
          {profile?.role === 'animateur'
            ? 'Gérez vos camps depuis le dashboard.'
            : 'Suivez les actualités des camps.'}
        </p>
      </div>

      {/* Camps */}
      {camps.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-orange-50">
          <div className="text-5xl mb-4">🏕️</div>
          <p className="text-gray-500 font-semibold">Aucun camp pour le moment</p>
          {profile?.role === 'animateur' && (
            <p className="text-sm text-gray-400 mt-1">Créez votre premier camp depuis le dashboard.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 mb-4">
            {camps.length} camp{camps.length > 1 ? 's' : ''}
          </p>
          {camps.map((camp) => (
            <CampCard key={camp.id} camp={camp} />
          ))}
        </div>
      )}
    </main>
  )
}
