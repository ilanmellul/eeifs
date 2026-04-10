import Image from 'next/image'
import { Post } from '@/types'
import { Info, CalendarDays, Camera } from 'lucide-react'
import CommentSection from './CommentSection'

interface PostCardProps {
  post: Post
  campId: string
  currentUserId?: string
}

const typeConfig = {
  photo: { icon: Camera, label: 'Photo', color: 'bg-violet-100 text-violet-600' },
  info: { icon: Info, label: 'Info', color: 'bg-sky-100 text-sky-600' },
  programme: { icon: CalendarDays, label: 'Programme', color: 'bg-amber-100 text-amber-600' },
}

// Warm gradient per initial letter
const avatarGradients = [
  'from-orange-400 to-rose-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-500',
  'from-teal-400 to-emerald-500',
  'from-violet-400 to-purple-500',
  'from-sky-400 to-blue-500',
]

function getGradient(name: string) {
  const code = name.charCodeAt(0) % avatarGradients.length
  return avatarGradients[code]
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

export default function PostCard({ post, campId, currentUserId }: PostCardProps) {
  const { icon: Icon, label, color } = typeConfig[post.type]
  const hasPhotos = post.photos && post.photos.length > 0
  const authorName = post.profiles?.name ?? 'Animateur'
  const authorInitial = authorName[0]?.toUpperCase() ?? '?'
  const isAnimateur = post.profiles?.role === 'animateur'
  const gradient = getGradient(authorName)

  return (
    <article className="bg-white border border-orange-50 rounded-3xl overflow-hidden shadow-sm shadow-orange-100">
      {/* Author header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-sm`}>
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
        <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${color}`}>
          <Icon className="w-3 h-3" />
          {label}
        </span>
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
              <Image
                src={photo.url}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 600px"
              />
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

      {/* Comments */}
      <CommentSection
        postId={post.id}
        campId={campId}
        comments={post.comments ?? []}
        currentUserId={currentUserId}
      />
    </article>
  )
}
