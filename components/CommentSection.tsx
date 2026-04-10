'use client'

import { useState, useTransition, useRef } from 'react'
import { Comment } from '@/types'
import { addComment } from '@/lib/actions/comments'
import { Send } from 'lucide-react'

interface CommentSectionProps {
  postId: string
  campId: string
  comments: Comment[]
  currentUserId?: string
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "à l'instant"
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}j`
}

export default function CommentSection({ postId, campId, comments, currentUserId }: CommentSectionProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const displayed = showAll ? comments : comments.slice(0, 2)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('post_id', postId)
    formData.set('camp_id', campId)

    startTransition(async () => {
      const result = await addComment(formData)
      if (result?.error) setError(result.error)
      else formRef.current?.reset()
    })
  }

  return (
    <div className="px-4 pb-4 pt-2 border-t border-gray-50">
      {/* Comment count */}
      {comments.length > 2 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="text-xs text-gray-400 hover:text-gray-600 mb-2 transition-colors"
        >
          Voir les {comments.length} commentaires
        </button>
      )}

      {/* Comments list */}
      {displayed.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {displayed.map((comment) => (
            <div key={comment.id} className="flex gap-2 items-start">
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-gray-500 text-xs font-medium">
                  {comment.profiles?.name?.[0]?.toUpperCase() ?? '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">
                  <span className="font-semibold mr-1">{comment.profiles?.name ?? 'Utilisateur'}</span>
                  {comment.content}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{timeAgo(comment.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      {currentUserId ? (
        <form ref={formRef} onSubmit={handleSubmit} className="flex gap-2 items-center">
          <input
            name="content"
            type="text"
            placeholder="Ajouter un commentaire..."
            required
            disabled={isPending}
            className="flex-1 text-sm py-1.5 bg-transparent border-b border-gray-200 focus:outline-none focus:border-gray-400 transition-colors placeholder:text-gray-300 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isPending}
            className="text-sky-500 hover:text-sky-600 disabled:opacity-40 transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <p className="text-xs text-gray-400">Connectez-vous pour commenter</p>
      )}

      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}
