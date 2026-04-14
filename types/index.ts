export type Role = 'parent' | 'animateur' | 'admin'
export type PostType = 'photo' | 'info' | 'programme'

export interface UserProfile {
  id: string
  name: string
  role: Role
  avatar_url?: string
  created_at: string
}

export interface Camp {
  id: string
  name: string
  date_start: string
  date_end: string
  created_at: string
}

export interface Photo {
  id: string
  post_id: string
  url: string
  created_at: string
}

export interface Comment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  profiles?: UserProfile
}

export type ReactionEmoji = '❤️' | '😂' | '🔥' | '👏'

export interface Reaction {
  id: string
  post_id: string
  user_id: string
  emoji: ReactionEmoji
  created_at: string
}

export interface Post {
  id: string
  camp_id: string
  user_id: string
  type: PostType
  content: string | null
  created_at: string
  profiles?: UserProfile
  photos?: Photo[]
  comments?: Comment[]
  reactions?: Reaction[]
}
