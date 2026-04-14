'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { Post } from '@/types'
import { Info, CalendarDays, Camera, Pencil, X, Check } from 'lucide-react'
import CommentSection from './CommentSection'
import { updatePost } from '@/lib/actions/posts'
import { toggleReaction } from '@/lib/actions/reactions'
import { Reaction, ReactionEmoji } from '@/types'

interface PostCardProps {
  post: Post
  campId: string
  currentUserId?: string
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `Il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours}h`
  return `Il y a ${Math.floor(hours / 24)}j`
}

const EMOJIS: ReactionEmoji[] = ['❤️', '😂', '🔥', '👏']

function ReactionBar({
  reactions,
  postId,
  campId,
  currentUserId,
}: {
  reactions: Reaction[]
  postId: string
  campId: string
  currentUserId?: string
}) {
  // Optimistic local state
  const [localReactions, setLocalReactions] = useState<Reaction[]>(reactions)
  const [pending, startPending] = useTransition()

  function countFor(emoji: ReactionEmoji) {
    return localReactions.filter((r) => r.emoji === emoji).length
  }
  function hasReacted(emoji: ReactionEmoji) {
    return currentUserId ? localReactions.some((r) => r.emoji === emoji && r.user_id === currentUserId) : false
  }

  function handleClick(emoji: ReactionEmoji) {
    if (!currentUserId) return
    // Optimistic update
    const already = hasReacted(emoji)
    setLocalReactions((prev) =>
      already
        ? prev.filter((r) => !(r.emoji === emoji && r.user_id === currentUserId))
        : [...prev, { id: 'optimistic', post_id: postId, user_id: currentUserId, emoji, created_at: new Date().toISOString() }]
    )
    startPending(async () => {
      await toggleReaction(postId, emoji, campId)
    })
  }

  const hasAny = EMOJIS.some((e) => countFor(e) > 0)
  if (!hasAny && !currentUserId) return null

  return (
    <div className="flex items-center gap-1.5 px-4 py-2">
      {EMOJIS.map((emoji) => {
        const count = countFor(emoji)
        const reacted = hasReacted(emoji)
        if (count === 0 && !currentUserId) return null
        return (
          <button
            key={emoji}
            onClick={() => handleClick(emoji)}
            disabled={pending || !currentUserId}
            aria-label={`Réagir ${emoji}`}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-all ${
              reacted
                ? 'bg-orange-100 text-orange-600 ring-1 ring-orange-300'
                : count > 0
                  ? 'bg-gray-100 text-gray-600 hover:bg-orange-50'
                  : 'bg-gray-50 text-gray-400 hover:bg-orange-50 hover:text-orange-500'
            }`}
          >
            <span>{emoji}</span>
            {count > 0 && <span>{count}</span>}
          </button>
        )
      })}
    </div>
  )
}

function getAvatarColor(name: string): string {
  const hue = (name.charCodeAt(0) * 47 + 30) % 360
  return `hsl(${hue}, 65%, 55%)`
}

export default function PostCard({ post, campId, currentUserId }: PostCardProps) {
  const hasPhotos = post.photos && post.photos.length > 0
  const authorName = post.profiles?.name ?? 'Animateur'
  const authorInitial = authorName[0]?.toUpperCase() ?? '?'
  const isAnimateur = post.profiles?.role === 'animateur' || post.profiles?.role === 'admin'
  const avatarColor = getAvatarColor(authorName)
  const canEdit = currentUserId === post.user_id && !hasPhotos

  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content ?? '')
  const [displayContent, setDisplayContent] = useState(post.content ?? '')
  const [editError, setEditError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function cancelEdit() {
    setEditContent(displayContent)
    setEditError(null)
    setIsEditing(false)
  }

  function saveEdit() {
    const trimmed = editContent.trim()
    if (!trimmed) { setEditError('Le contenu ne peut pas être vide'); return }
    setEditError(null)
    startTransition(async () => {
      const result = await updatePost(post.id, trimmed)
      if (result?.error) {
        setEditError(result.error)
      } else {
        setDisplayContent(trimmed)
        setIsEditing(false)
      }
    })
  }

  return (
    <article className="bg-white border border-orange-50 rounded-3xl overflow-hidden shadow-sm shadow-orange-100">
      {/* Author header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm"
          style={{ background: avatarColor }}
        >
          <span className="text-white font-bold text-sm">{authorInitial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-gray-900">{authorName}</span>
            {isAnimateur && (
              <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium">
                animateur
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">{timeAgo(post.created_at)}</p>
        </div>

        {canEdit && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            aria-label="Modifier le post"
            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}

        {post.type === 'photo' && (
          <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-violet-100 text-violet-600">
            <Camera className="w-3 h-3" /> Photo
          </span>
        )}
        {post.type === 'info' && (
          <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-sky-100 text-sky-600">
            <Info className="w-3 h-3" /> Info
          </span>
        )}
        {post.type === 'programme' && (
          <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-600">
            <CalendarDays className="w-3 h-3" /> Programme
          </span>
        )}
      </div>

      {/* Photos */}
      {hasPhotos && (
        <div className={`grid gap-0.5 ${post.photos!.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {post.photos!.map((photo, i) => (
            <div
              key={photo.id}
              className={`relative overflow-hidden bg-orange-50 ${
                post.photos!.length === 1 ? 'aspect-[4/3]' : 'aspect-square'
              } ${post.photos!.length === 3 && i === 0 ? 'col-span-2 aspect-video' : ''}`}
            >
              <Image src={photo.url} alt="" fill className="object-cover"
                sizes="(max-width: 768px) 100vw, 600px" />
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {isEditing ? (
        <div className="px-4 pt-3 pb-3 space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            autoFocus
            className="w-full px-3 py-2 rounded-xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm resize-none bg-orange-50/40"
          />
          {editError && (
            <p className="text-xs text-red-500">{editError}</p>
          )}
          <div className="flex gap-2 justify-end">
            <button
              onClick={cancelEdit}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X className="w-3 h-3" /> Annuler
            </button>
            <button
              onClick={saveEdit}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-orange-400 to-rose-500 hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              <Check className="w-3 h-3" /> {isPending ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      ) : (
        displayContent && (
          <div className="px-4 pt-3 pb-1">
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
              <span className="font-semibold mr-1">{authorName}</span>
              {displayContent}
            </p>
          </div>
        )
      )}

      <ReactionBar
        reactions={post.reactions ?? []}
        postId={post.id}
        campId={campId}
        currentUserId={currentUserId}
      />

      <CommentSection
        postId={post.id}
        campId={campId}
        comments={post.comments ?? []}
        currentUserId={currentUserId}
      />
    </article>
  )
}
