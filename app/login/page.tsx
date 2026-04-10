'use client'

import { useState, useTransition } from 'react'
import { login, signup } from '@/lib/actions/auth'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = mode === 'login' ? await login(formData) : await signup(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-18 h-18 mb-4">
            <span className="text-6xl">🏕️</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            EEIFS <span className="text-orange-500">Camp</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">Bienvenue sur la plateforme des camps d&apos;été !</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-orange-100 p-8 border border-orange-50">
          {/* Tabs */}
          <div className="flex bg-orange-50 rounded-2xl p-1 mb-6">
            <button
              onClick={() => { setMode('login'); setError(null) }}
              className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
                mode === 'login' ? 'bg-white shadow text-orange-500' : 'text-gray-400'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => { setMode('signup'); setError(null) }}
              className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
                mode === 'signup' ? 'bg-white shadow text-orange-500' : 'text-gray-400'
              }`}
            >
              Inscription
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">Nom complet</label>
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="Jean Dupont"
                    className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent text-sm bg-orange-50/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">Je suis...</label>
                  <select
                    name="role"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm bg-orange-50/30"
                  >
                    <option value="parent">👨‍👩‍👧 Parent</option>
                    <option value="animateur">🎯 Animateur</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">Email</label>
              <input
                name="email"
                type="email"
                required
                placeholder="vous@exemple.fr"
                className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent text-sm bg-orange-50/30"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">Mot de passe</label>
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                minLength={6}
                className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent text-sm bg-orange-50/30"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-500">
                {error}
              </div>
            )}

            <Button type="submit" loading={isPending} className="w-full mt-2" size="lg">
              {mode === 'login' ? '👋 Se connecter' : '🎉 Créer mon compte'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
