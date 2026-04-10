'use client'

import { useState } from 'react'
import { Post, UserProfile } from '@/types'
import PostCard from './PostCard'
import PostForm from './PostForm'
import PhotoGallery from './PhotoGallery'
import { LayoutList, PlusCircle, Images } from 'lucide-react'

interface CampFeedProps {
  posts: Post[]
  campId: string
  currentUserId?: string
  userProfile: UserProfile | null
}

type Tab = 'wall' | 'photos' | 'publier'

export default function CampFeed({ posts, campId, currentUserId, userProfile }: CampFeedProps) {
  const isAnimateur = userProfile?.role === 'animateur' || userProfile?.role === 'admin'
  const [tab, setTab] = useState<Tab>('wall')

  // Extraire toutes les photos avec métadonnées auteur
  const allPhotos = posts.flatMap((post) =>
    (post.photos ?? []).map((photo) => ({
      ...photo,
      authorName: post.profiles?.name,
      postDate: post.created_at,
    }))
  )

  const tabs: { id: Tab; label: string; icon: typeof LayoutList; show: boolean }[] = [
    { id: 'wall',    label: 'Wall',    icon: LayoutList, show: true },
    { id: 'photos',  label: 'Photos',  icon: Images,     show: true },
    { id: 'publier', label: 'Publier', icon: PlusCircle, show: isAnimateur },
  ]

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.filter((t) => t.show).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === id
                ? 'bg-gradient-to-r from-orange-400 to-rose-500 text-white shadow-sm shadow-orange-200'
                : 'bg-white text-gray-500 border border-orange-100 hover:border-orange-200 hover:text-orange-500'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {id === 'photos' && allPhotos.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                tab === 'photos' ? 'bg-white/25 text-white' : 'bg-orange-100 text-orange-500'
              }`}>
                {allPhotos.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Wall */}
      {tab === 'wall' && (
        posts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-orange-50">
            <div className="text-5xl mb-4">🏕️</div>
            <p className="font-semibold text-gray-700">Aucune publication pour l&apos;instant</p>
            <p className="text-sm text-gray-400 mt-1">
              {isAnimateur ? 'Soyez le premier à publier !' : "Les animateurs n'ont pas encore publié."}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} campId={campId} currentUserId={currentUserId} />
            ))}
          </div>
        )
      )}

      {/* Photos */}
      {tab === 'photos' && (
        <PhotoGallery photos={allPhotos} />
      )}

      {/* Publier */}
      {tab === 'publier' && isAnimateur && (
        <PostForm campId={campId} onSuccess={() => setTab('wall')} />
      )}
    </div>
  )
}
