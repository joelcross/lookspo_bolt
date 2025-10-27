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
  is_liked?: boolean;
  is_saved?: boolean;
}

export interface Like {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface Collection {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  post_count?: number;
}

export interface Save {
  id: string;
  user_id: string;
  post_id: string;
  collection_id: string;
  created_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Activity {
  id: string;
  actor_id: string;
  target_user_id: string;
  type: 'like' | 'save' | 'follow';
  post_id: string | null;
  created_at: string;
  actor?: Profile;
  post?: Post;
}
