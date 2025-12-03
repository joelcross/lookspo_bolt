// lib/types.ts
export interface Profile {
  id: string;
  username: string;
  name: string;
  bio: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Post {
  id: string;
  image_url: string;
  caption: string;
  user_id: string;
  created_at: string;
  profiles?: Profile;
  pieces?: Piece[];
}

export interface Collection {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  cover_images?: string[];
  post_count?: number;

  // For nested queries (like in PostDetail)
  user?: {
    username: string;
  };
}

export interface Save {
  id: string;
  user_id: string;
  post_id: string;
  collection_id: string;
  created_at: string;
}

export interface Activity {
  id: string;
  actor_id: string;
  target_user_id?: string | null;
  type: 'like' | 'save' | 'follow';
  post_id?: string | null;
  collection_id?: string | null;
  created_at: string;

  actor?: Profile;
  target_user?: { id: string; username: string };
  post?: Post;
  collection?: Collection;
}

export interface Piece {
  name: string;
  brand: string;
  url?: string;
  isTemplate?: boolean;
}
