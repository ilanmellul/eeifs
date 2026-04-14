'use client'

import { Post } from '@/types'
import { CalendarDays } from 'lucide-react'

interface ProgrammeViewProps {
  posts: Post[]
}

function formatDayFull(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function toDateKey(dateStr: string) {
  return new Date(dateStr).toISOString().slice(0, 10)
}

export default function ProgrammeView({ posts }: ProgrammeViewProps) {
  const programmePosts = posts.filter((p) => p.type === 'programme')

  if (programmePosts.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-orange-50">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-50 rounded-2xl mb-4">
          <CalendarDays className="w-8 h-8 text-amber-300" />
        </div>
        <p className="font-semibold text-gray-600">Aucun programme publié</p>
        <p className="text-sm text-gray-400 mt-1">Les animateurs n&apos;ont pas encore publié le programme.</p>
      </div>
    )
  }

  // Grouper par jour (clé YYYY-MM-DD)
  const grouped = programmePosts.reduce<Record<string, Post[]>>((acc, post) => {
    const key = toDateKey(post.created_at)
    if (!acc[key]) acc[key] = []
    acc[key].push(post)
    return acc
  }, {})

  const sortedDays = Object.keys(grouped).sort()

  return (
    <div className="space-y-6">
      {sortedDays.map((day) => (
        <div key={day} className="bg-white rounded-3xl border border-orange-50 shadow-sm shadow-orange-100 overflow-hidden">
          {/* En-tête du jour */}
          <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-orange-100">
            <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-amber-100">
              <CalendarDays className="w-4 h-4 text-amber-600" />
            </div>
            <span className="font-bold text-gray-800 capitalize">
              {formatDayFull(grouped[day][0].created_at)}
            </span>
            <span className="ml-auto text-xs text-amber-600 font-medium bg-amber-100 px-2 py-0.5 rounded-full">
              {grouped[day].length} entrée{grouped[day].length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Posts du jour */}
          <div className="divide-y divide-orange-50">
            {grouped[day].map((post) => (
              <div key={post.id} className="px-5 py-4">
                {post.profiles?.name && (
                  <p className="text-xs font-semibold text-orange-400 mb-1">{post.profiles.name}</p>
                )}
                {post.content && (
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
