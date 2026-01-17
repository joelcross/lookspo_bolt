import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Post } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';

type PostsMode =
  | { type: 'all' }
  | { type: 'following' }
  | { type: 'user'; userId: string }
  | { type: 'collection'; collectionId: string };

const POSTS_PER_PAGE = 10;

export function usePosts(initialMode: PostsMode) {
  const { user } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch on mount and when mode changes
  useEffect(() => {
    if (initialMode) {
      fetchPosts(initialMode, true);
    }
  }, [
    initialMode?.type,
    initialMode?.type === 'user' ? initialMode.userId : null,
    initialMode?.type === 'collection' ? initialMode.collectionId : null,
  ]);

  const fetchPosts = useCallback(
    async (mode: PostsMode = initialMode, reset = false) => {
      if (loading) return;
      if (!reset && !hasMore) return;

      const targetPage = reset ? 0 : page;
      setLoading(true);

      try {
        let query = supabase
          .from('posts')
          .select(
            `
    *,
    profiles:user_id (*)
  `,
          )
          .order('created_at', { ascending: false })
          .range(
            targetPage * POSTS_PER_PAGE,
            targetPage * POSTS_PER_PAGE + POSTS_PER_PAGE - 1,
          );

        if (mode.type === 'user') {
          query = supabase
            .from('posts')
            .select('*, profiles:user_id (*)')
            .eq('user_id', mode.userId)
            .order('created_at', { ascending: false })
            .range(
              targetPage * POSTS_PER_PAGE,
              targetPage * POSTS_PER_PAGE + POSTS_PER_PAGE - 1,
            );
        }

        if (mode.type === 'collection') {
          query = supabase
            .from('saves')
            .select('posts(*, profiles:user_id (*))')
            .eq('collection_id', mode.collectionId)
            .order('created_at', { ascending: false })
            .range(
              targetPage * POSTS_PER_PAGE,
              targetPage * POSTS_PER_PAGE + POSTS_PER_PAGE - 1,
            );
        }

        if (mode.type === 'following') {
          if (!user) return;
          const { data: following } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', user.id);

          const ids = following?.map((f) => f.following_id) || [];
          if (ids.length === 0) {
            setPosts([]);
            setHasMore(false);
            return;
          }

          query = supabase
            .from('posts')
            .select('*, profiles:user_id (*)')
            .in('user_id', ids)
            .order('created_at', { ascending: false })
            .range(
              targetPage * POSTS_PER_PAGE,
              targetPage * POSTS_PER_PAGE + POSTS_PER_PAGE - 1,
            );
        }

        const { data, error } = await query;
        if (error) throw error;

        let newPosts: Post[] = data ?? [];
        if (mode.type === 'collection') {
          newPosts = newPosts.map((row: any) => row.posts).filter(Boolean);
        }

        setPosts((prev) => (reset ? newPosts : [...prev, ...newPosts]));
        setHasMore(newPosts.length === POSTS_PER_PAGE);
        setPage(reset ? 1 : targetPage + 1);
      } catch (err) {
        console.error('usePosts fetch error:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [initialMode, page, hasMore, loading, user],
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setHasMore(true);
    setPage(0);
    fetchPosts(initialMode, true);
  }, [fetchPosts, initialMode]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) fetchPosts(initialMode, false);
  }, [loading, hasMore, fetchPosts, initialMode]);

  return {
    posts,
    loading,
    refreshing,
    hasMore,
    handleRefresh,
    handleLoadMore,
    fetchPosts, // manually call with any mode you want
  };
}
