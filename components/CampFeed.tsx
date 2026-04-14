'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { Post, UserProfile, Album, CampInfo } from '@/types'
import { getPosts } from '@/lib/actions/posts'
import { createAlbum, deleteAlbum } from '@/lib/actions/albums'
import PostCard from './PostCard'
import PostForm from './PostForm'
import PhotoGallery from './PhotoGallery'
import ProgrammeView from './ProgrammeView'
import CampInfoTab from './CampInfoTab'
import { LayoutList, PlusCircle, Images, CalendarDays, Loader2, FolderPlus, ChevronLeft, Trash2, FolderOpen, ImageOff, Info } from 'lucide-react'

interface CampFeedProps {
  posts: Post[]
  campId: string
  currentUserId?: string
  userProfile: UserProfile | null
  initialAlbums: Album[]
  campInfo: CampInfo | null
}

type Tab = 'wall' | 'photos' | 'programme' | 'infos' | 'publier'

const POSTS_PER_PAGE = 20

export default function CampFeed({ posts: initialPosts, campId, currentUserId, userProfile, initialAlbums, campInfo }: CampFeedProps) {
  const isAnimateur = userProfile?.role === 'animateur' || userProfile?.role === 'admin'
  const [tab, setTab] = useState<Tab>('wall')
  const [allPosts, setAllPosts] = useState<Post[]>(initialPosts)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(initialPosts.length === POSTS_PER_PAGE)
  const [loadingMore, startLoadMore] = useTransition()
  const [refreshing, startRefresh] = useTransition()

  // Albums state
  const [albums, setAlbums] = useState<Album[]>(initialAlbums)
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null) // null = grille, 'wall' = wall, string = album id
  const [showCreateAlbum, setShowCreateAlbum] = useState(false)
  const [newAlbumName, setNewAlbumName] = useState('')
  const [albumError, setAlbumError] = useState<string | null>(null)
  const [creatingAlbum, startCreatingAlbum] = useTransition()
  const [deletingAlbumId, setDeletingAlbumId] = useState<string | null>(null)

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

  function handleCreateAlbum() {
    const name = newAlbumName.trim()
    if (!name) { setAlbumError('Entrez un nom d\'album'); return }
    setAlbumError(null)
    startCreatingAlbum(async () => {
      const fd = new FormData()
      fd.set('camp_id', campId)
      fd.set('name', name)
      const result = await createAlbum(fd)
      if (result?.error) {
        setAlbumError(result.error)
      } else if (result.album) {
        setAlbums((prev) => [...prev, result.album as Album])
        setNewAlbumName('')
        setShowCreateAlbum(false)
      }
    })
  }

  function handleDeleteAlbum(albumId: string) {
    setDeletingAlbumId(albumId)
    deleteAlbum(albumId, campId).then((result) => {
      if (!result?.error) {
        setAlbums((prev) => prev.filter((a) => a.id !== albumId))
        if (selectedAlbumId === albumId) setSelectedAlbumId(null)
      }
      setDeletingAlbumId(null)
    })
  }

  // Extraire toutes les photos avec métadonnées
  const allPhotos = allPosts.flatMap((post) =>
    (post.photos ?? []).map((photo) => ({
      ...photo,
      authorName: post.profiles?.name,
      postDate: post.created_at,
      albumId: post.album_id ?? undefined,
    }))
  )

  // Photos filtrées selon l'album sélectionné
  const photosForSelectedAlbum = selectedAlbumId === 'wall'
    ? allPhotos.filter((p) => !p.albumId)
    : selectedAlbumId
      ? allPhotos.filter((p) => p.albumId === selectedAlbumId)
      : allPhotos

  const programmePosts = allPosts.filter((p) => p.type === 'programme')

  const tabs: { id: Tab; label: string; icon: typeof LayoutList; show: boolean; badge?: number }[] = [
    { id: 'wall',      label: 'Wall',      icon: LayoutList,   show: true },
    { id: 'photos',    label: 'Photos',    icon: Images,       show: true,       badge: allPhotos.length },
    { id: 'programme', label: 'Programme', icon: CalendarDays, show: true,       badge: programmePosts.length },
    { id: 'infos',     label: 'Infos',     icon: Info,         show: true },
    { id: 'publier',   label: 'Publier',   icon: PlusCircle,   show: isAnimateur },
  ]

  // Couverture d'album = première photo de l'album
  function getCoverPhoto(albumId: string | 'wall') {
    const photos = albumId === 'wall'
      ? allPhotos.filter((p) => !p.albumId)
      : allPhotos.filter((p) => p.albumId === albumId)
    return photos[0]?.url ?? null
  }

  const wallPhotoCount = allPhotos.filter((p) => !p.albumId).length
  const selectedAlbum = selectedAlbumId && selectedAlbumId !== 'wall'
    ? albums.find((a) => a.id === selectedAlbumId)
    : null

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.filter((t) => t.show).map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => { setTab(id); if (id !== 'photos') setSelectedAlbumId(null) }}
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

      {/* Photos — grille d'albums ou vue album */}
      {tab === 'photos' && (
        selectedAlbumId !== null ? (
          // Vue album sélectionné
          <div>
            <div className="flex items-center gap-3 mb-5">
              <button
                onClick={() => setSelectedAlbumId(null)}
                className="flex items-center gap-1.5 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Retour aux albums
              </button>
              <span className="text-gray-300">·</span>
              <span className="font-bold text-gray-800">
                {selectedAlbumId === 'wall' ? 'Wall' : selectedAlbum?.name}
              </span>
              {selectedAlbum && isAnimateur && (
                <button
                  onClick={() => handleDeleteAlbum(selectedAlbum.id)}
                  disabled={deletingAlbumId === selectedAlbum.id}
                  aria-label="Supprimer l'album"
                  className="ml-auto flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 px-2.5 py-1.5 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {deletingAlbumId === selectedAlbum.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />
                  }
                  Supprimer l&apos;album
                </button>
              )}
            </div>
            <PhotoGallery photos={photosForSelectedAlbum} />
          </div>
        ) : (
          // Grille d'albums
          <div>
            {isAnimateur && (
              <div className="mb-5">
                {showCreateAlbum ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newAlbumName}
                      onChange={(e) => setNewAlbumName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleCreateAlbum(); if (e.key === 'Escape') setShowCreateAlbum(false) }}
                      placeholder="Nom de l'album…"
                      autoFocus
                      className="flex-1 px-3 py-2 rounded-xl border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
                    />
                    <button
                      onClick={handleCreateAlbum}
                      disabled={creatingAlbum}
                      className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-orange-400 to-rose-500 hover:opacity-90 disabled:opacity-60 transition-opacity"
                    >
                      {creatingAlbum ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Créer'}
                    </button>
                    <button
                      onClick={() => { setShowCreateAlbum(false); setNewAlbumName(''); setAlbumError(null) }}
                      className="px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCreateAlbum(true)}
                    className="flex items-center gap-2 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors"
                  >
                    <FolderPlus className="w-4 h-4" /> Nouvel album
                  </button>
                )}
                {albumError && <p className="text-xs text-red-500 mt-1">{albumError}</p>}
              </div>
            )}

            {allPhotos.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-orange-50">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-50 rounded-2xl mb-4">
                  <ImageOff className="w-8 h-8 text-orange-300" />
                </div>
                <p className="font-semibold text-gray-600">Aucune photo pour l&apos;instant</p>
                <p className="text-sm text-gray-400 mt-1">Les photos publiées apparaîtront ici.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Album Wall */}
                <AlbumCard
                  name="Wall"
                  photoCount={wallPhotoCount}
                  coverUrl={getCoverPhoto('wall')}
                  onClick={() => setSelectedAlbumId('wall')}
                />
                {/* Albums créés */}
                {albums.map((album) => {
                  const count = allPhotos.filter((p) => p.albumId === album.id).length
                  return (
                    <AlbumCard
                      key={album.id}
                      name={album.name}
                      photoCount={count}
                      coverUrl={getCoverPhoto(album.id)}
                      onClick={() => setSelectedAlbumId(album.id)}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )
      )}

      {/* Programme */}
      {tab === 'programme' && (
        <ProgrammeView posts={allPosts} />
      )}

      {/* Infos du camp */}
      {tab === 'infos' && (
        <CampInfoTab campId={campId} info={campInfo} canEdit={isAnimateur} />
      )}

      {/* Publier */}
      {tab === 'publier' && isAnimateur && (
        <PostForm campId={campId} albums={albums} onSuccess={refreshAndGoToWall} />
      )}
    </div>
  )
}

function AlbumCard({
  name,
  photoCount,
  coverUrl,
  onClick,
}: {
  name: string
  photoCount: number
  coverUrl: string | null
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group relative aspect-square rounded-2xl overflow-hidden bg-orange-50 border border-orange-100 hover:border-orange-300 transition-all hover:shadow-md hover:shadow-orange-100"
    >
      {coverUrl ? (
        <Image src={coverUrl} alt="" fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width: 640px) 50vw, 33vw" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <FolderOpen className="w-10 h-10 text-orange-200" />
        </div>
      )}
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
        <p className="text-white font-bold text-sm leading-tight truncate">{name}</p>
        <p className="text-white/70 text-xs">{photoCount} photo{photoCount !== 1 ? 's' : ''}</p>
      </div>
    </button>
  )
}
