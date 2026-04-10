'use client'

import { useState } from 'react'
import { Post, UserProfile } from '@/types'
import PostCard from './PostCard'
import PostForm from './PostForm'
import { LayoutList, PlusCircle } from 'lucide-react'

interface CampFeedProps {
  posts: Post[]
  campId: string
  currentUserId?: string
  userProfile: UserProfile | null
}

export default function CampFeed({ posts, campId, currentUserId, userProfile }: CampFeedProps) {
  const isAnimateur = userProfile?.role === 'animateur' || userProfile?.role === 'admin'
  const [tab, setTab] = useState<'wall' | 'publier'>('wall')

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('wall')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            tab === 'wall'
              ? 'bg-gradient-to-r from-orange-400 to-rose-500 text-white shadow-sm shadow-orange-200'
              : 'bg-white text-gray-500 border border-orange-100 hover:border-orange-200 hover:text-orange-500'
          }`}
        >
          <LayoutList className="w-4 h-4" />
          Wall
        </button>
        {isAnimateur && (
          <button
            onClick={() => setTab('publier')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === 'publier'
                ? 'bg-gradient-to-r from-orange-400 to-rose-500 text-white shadow-sm shadow-orange-200'
                : 'bg-white text-gray-500 border border-orange-100 hover:border-orange-200 hover:text-orange-500'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Publier
          </button>
        )}
      </div>

      {/* Wall */}
      {tab === 'wall' && (
        <>
          {posts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-orange-50">
              <div className="text-5xl mb-4">🏕️</div>
              <p className="font-semibold text-gray-700">Aucune publication pour l&apos;instant</p>
              <p className="text-sm text-gray-400 mt-1">
                {isAnimateur ? 'Soyez le premier à publier !' : 'Les animateurs n\'ont pas encore publié.'}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  campId={campId}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Publier */}
      {tab === 'publier' && isAnimateur && (
        <PostForm campId={campId} onSuccess={() => setTab('wall')} />
      )}
    </div>
  )
}
