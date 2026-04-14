'use client'

import { useState, useTransition } from 'react'
import { Post, UserProfile } from '@/types'
import { getPosts } from '@/lib/actions/posts'
import PostCard from './PostCard'
import PostForm from './PostForm'
import PhotoGallery from './PhotoGallery'
import ProgrammeView from './ProgrammeView'
import { LayoutList, PlusCircle, Images, CalendarDays, Loader2 } from 'lucide-react'

interface CampFeedProps {
  posts: Post[]
  campId: string
  currentUserId?: string
  userProfile: UserProfile | null
}

type Tab = 'wall' | 'photos' | 'programme' | 'publier'

const POSTS_PER_PAGE = 20

export default function CampFeed({ posts: initialPosts, campId, currentUserId, userProfile }: CampFeedProps) {
  const isAnimateur = userProfile?.role === 'animateur' || userProfile?.role === 'admin'
  const [tab, setTab] = useState<Tab>('wall')
  const [allPosts, setAllPosts] = useState<Post[]>(initialPosts)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(initialPosts.length === POSTS_PER_PAGE)
  const [loadingMore, startLoadMore] = useTransition()
  const [refreshing, startRefresh] = useTransition()

  function loadMore() {
    startLoadMore(async () => {
      const nextPage = page + 1
      const newPosts = await getPosts(campId, nextPage) as Post[]
      setAllPosts((prev) => [...prev, ...newPosts])
      setPage(nextPage)
      setHasMore(newPosts.length === POSTS_PER_PAGE)
    })
  }

  function refreshAndGoToWall() {
    startRefresh(async () => {
      const fresh = await getPosts(campId, 0) as Post[]
      setAllPosts(fresh)
      setPage(0)
      setHasMore(fresh.length === POSTS_PER_PAGE)
      setTab('wall')
    })
  }

  // Extraire toutes les photos avec métadonnées auteur
  const allPhotos = allPosts.flatMap((post) =>
    (post.photos ?? []).map((photo) => ({
      ...photo,
      authorName: post.profiles?.name,
      postDate: post.created_at,
    }))
  )

  const programmePosts = allPosts.filter((p) => p.type === 'programme')

  const tabs: { id: Tab; label: string; icon: typeof LayoutList; show: boolean; badge?: number }[] = [
    { id: 'wall',      label: 'Wall',      icon: LayoutList,   show: true },
    { id: 'photos',    label: 'Photos',    icon: Images,       show: true,       badge: allPhotos.length },
    { id: 'programme', label: 'Programme', icon: CalendarDays, show: true,       badge: programmePosts.length },
    { id: 'publier',   label: 'Publier',   icon: PlusCircle,   show: isAnimateur },
  ]

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.filter((t) => t.show).map(({ id, label, icon: Icon, badge }) => (
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
            {badge !== undefined && badge > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                tab === id ? 'bg-white/25 text-white' : 'bg-orange-100 text-orange-500'
              }`}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Wall */}
      {tab === 'wall' && (
        allPosts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-orange-50">
            <div className="text-5xl mb-4">🏕️</div>
            <p className="font-semibold text-gray-700">Aucune publication pour l&apos;instant</p>
            <p className="text-sm text-gray-400 mt-1">
              {isAnimateur ? 'Soyez le premier à publier !' : "Les animateurs n'ont pas encore publié."}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {allPosts.map((post) => (
              <PostCard key={post.id} post={post} campId={campId} currentUserId={currentUserId} />
            ))}

            {hasMore && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-white border border-orange-100 text-orange-500 hover:bg-orange-50 transition-all disabled:opacity-60"
                >
                  {loadingMore ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Chargement…</>
                  ) : (
                    'Voir plus de publications'
                  )}
                </button>
              </div>
            )}
          </div>
        )
      )}

      {/* Photos */}
      {tab === 'photos' && (
        <PhotoGallery photos={allPhotos} />
      )}

      {/* Programme */}
      {tab === 'programme' && (
        <ProgrammeView posts={allPosts} />
      )}

      {/* Publier */}
      {tab === 'publier' && isAnimateur && (
        <PostForm campId={campId} onSuccess={refreshAndGoToWall} />
      )}
    </div>
  )
}
