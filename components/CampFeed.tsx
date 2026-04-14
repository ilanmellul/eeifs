'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { Post, UserProfile, Album, CampInfo, Camp } from '@/types'
import { getPosts } from '@/lib/actions/posts'
import { createAlbum, deleteAlbum } from '@/lib/actions/albums'
import PostCard from './PostCard'
import PostForm from './PostForm'
import PhotoGallery from './PhotoGallery'
import ProgrammeView from './ProgrammeView'
import CampInfoTab from './CampInfoTab'
import WeatherTab from './WeatherTab'
import {
  LayoutList, PlusCircle, Images, CalendarDays, Loader2,
  FolderPlus, ChevronLeft, Trash2, FolderOpen, ImageOff,
  Info, CloudSun, MapPin,
} from 'lucide-react'

interface CampFeedProps {
  camp: Camp
  posts: Post[]
  campId: string
  currentUserId?: string
  userProfile: UserProfile | null
  initialAlbums: Album[]
  campInfo: CampInfo | null
}

type Tab = 'wall' | 'photos' | 'programme' | 'infos' | 'meteo' | 'publier'

const POSTS_PER_PAGE = 20

function formatDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

// Initiales à partir du nom de camp
function getCampInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export default function CampFeed({
  camp,
  posts: initialPosts,
  campId,
  currentUserId,
  userProfile,
  initialAlbums,
  campInfo,
}: CampFeedProps) {
  const isAnimateur = userProfile?.role === 'animateur' || userProfile?.role === 'admin'
  const [tab, setTab] = useState<Tab>('wall')
  const [allPosts, setAllPosts] = useState<Post[]>(initialPosts)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(initialPosts.length === POSTS_PER_PAGE)
  const [loadingMore, startLoadMore] = useTransition()
  const [, startRefresh] = useTransition()

  // Albums state
  const [albums, setAlbums] = useState<Album[]>(initialAlbums)
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null)
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

  const allPhotos = allPosts.flatMap((post) =>
    (post.photos ?? []).map((photo) => ({
      ...photo,
      authorName: post.profiles?.name,
      postDate: post.created_at,
      albumId: post.album_id ?? undefined,
    }))
  )

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
    { id: 'meteo',     label: 'Météo',     icon: CloudSun,     show: true },
    { id: 'publier',   label: 'Publier',   icon: PlusCircle,   show: isAnimateur },
  ]

  const visibleTabs = tabs.filter((t) => t.show)

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

  function changeTab(id: Tab) {
    setTab(id)
    if (id !== 'photos') setSelectedAlbumId(null)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">

      {/* ── Sidebar ── */}
      <aside className="w-full lg:w-60 xl:w-64 shrink-0 lg:sticky lg:top-20">

        {/* Camp header card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-400 via-rose-500 to-pink-600 p-5 shadow-lg shadow-rose-200 mb-3">
          {/* Decoration circles */}
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />

          {/* Initials */}
          <div className="relative w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-3 shadow-sm">
            <span className="text-white font-black text-lg tracking-tight">
              {getCampInitials(camp.name)}
            </span>
          </div>

          {/* Name */}
          <h1 className="relative text-white font-black text-lg leading-tight mb-2">
            {camp.name}
          </h1>

          {/* Dates */}
          <div className="relative flex items-center gap-1.5 text-white/70 text-xs font-medium">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>{formatDateShort(camp.date_start)} → {formatDateShort(camp.date_end)}</span>
          </div>

          {/* City if available */}
          {campInfo?.city && (
            <div className="relative flex items-center gap-1.5 text-white/60 text-xs mt-1.5">
              <MapPin className="w-3 h-3" />
              <span>{campInfo.city}</span>
            </div>
          )}
        </div>

        {/* Sidebar nav — desktop */}
        <nav className="hidden lg:flex flex-col gap-1">
          {visibleTabs.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => changeTab(id)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all text-left w-full ${
                tab === id
                  ? 'bg-gradient-to-r from-orange-400 to-rose-500 text-white shadow-sm shadow-orange-200'
                  : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {badge !== undefined && badge > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  tab === id ? 'bg-white/25 text-white' : 'bg-orange-100 text-orange-500'
                }`}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Mobile tabs — horizontal scroll */}
        <nav className="lg:hidden flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {visibleTabs.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => changeTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
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
        </nav>
      </aside>

      {/* ── Content ── */}
      <div className="flex-1 min-w-0">

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
                    {loadingMore
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Chargement…</>
                      : 'Voir plus de publications'
                    }
                  </button>
                </div>
              )}
            </div>
          )
        )}

        {/* Photos */}
        {tab === 'photos' && (
          selectedAlbumId !== null ? (
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
                  <AlbumCard name="Wall" photoCount={wallPhotoCount} coverUrl={getCoverPhoto('wall')} onClick={() => setSelectedAlbumId('wall')} />
                  {albums.map((album) => {
                    const count = allPhotos.filter((p) => p.albumId === album.id).length
                    return (
                      <AlbumCard key={album.id} name={album.name} photoCount={count} coverUrl={getCoverPhoto(album.id)} onClick={() => setSelectedAlbumId(album.id)} />
                    )
                  })}
                </div>
              )}
            </div>
          )
        )}

        {/* Programme */}
        {tab === 'programme' && <ProgrammeView posts={allPosts} />}

        {/* Infos */}
        {tab === 'infos' && <CampInfoTab campId={campId} info={campInfo} canEdit={isAnimateur} />}

        {/* Météo */}
        {tab === 'meteo' && <WeatherTab city={campInfo?.city ?? null} />}

        {/* Publier */}
        {tab === 'publier' && isAnimateur && (
          <PostForm campId={campId} albums={albums} onSuccess={refreshAndGoToWall} />
        )}
      </div>
    </div>
  )
}

function AlbumCard({ name, photoCount, coverUrl, onClick }: {
  name: string; photoCount: number; coverUrl: string | null; onClick: () => void
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
        <p className="text-white font-bold text-sm leading-tight truncate">{name}</p>
        <p className="text-white/70 text-xs">{photoCount} photo{photoCount !== 1 ? 's' : ''}</p>
      </div>
    </button>
  )
}
