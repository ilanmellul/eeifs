import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/lib/actions/auth'
import { UserRound, LogOut, Shield } from 'lucide-react'

export default async function Navbar() {
  const supabase = await createClient()
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

  const isAdmin = profile?.role === 'admin'

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-orange-100 shadow-sm shadow-orange-50">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-rose-500 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white text-sm font-bold">E</span>
          </div>
          <span className="font-bold text-gray-900">EEIFS <span className="text-orange-500">Camp</span></span>
        </Link>

        <nav className="flex items-center gap-2">
          {user && isAdmin && (
            <Link href="/dashboard">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all border bg-gradient-to-r from-rose-50 to-purple-50 border-rose-200 text-rose-600 hover:from-rose-100 hover:to-purple-100">
                <Shield className="w-3.5 h-3.5" />
                Dashboard
              </div>
            </Link>
          )}

          {user && (
            <Link href="/compte">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 transition-all">
                <UserRound className="w-3.5 h-3.5" />
                Mon compte
              </div>
            </Link>
          )}

          {user ? (
            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:block">Déconnexion</span>
              </button>
            </form>
          ) : (
            <Link href="/login">
              <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-orange-400 to-rose-500 text-white shadow-sm shadow-orange-200 hover:from-orange-500 hover:to-rose-600 transition-all">
                Connexion
              </div>
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
