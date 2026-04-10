import Image from 'next/image'
import { Post } from '@/types'
import { Info, CalendarDays, Camera } from 'lucide-react'
import CommentSection from './CommentSection'

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

// Couleur avatar basée sur la première lettre — inline style évite les classes dynamiques
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
      {post.content && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            <span className="font-semibold mr-1">{authorName}</span>
            {post.content}
          </p>
        </div>
      )}

      <CommentSection
        postId={post.id}
        campId={campId}
        comments={post.comments ?? []}
        currentUserId={currentUserId}
      />
    </article>
  )
}
