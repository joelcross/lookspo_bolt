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

export function usePosts(mode: PostsMode) {
  const { user } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const buildQuery = useCallback(
    async (pageNum: number) => {
      let query = supabase
        .from('posts')
        .select(
          `
          *,
          profiles:user_id (*)
        `
        )
        .order('created_at', { ascending: false })
        .range(
          pageNum * POSTS_PER_PAGE,
          pageNum * POSTS_PER_PAGE + POSTS_PER_PAGE - 1
        );

      // Following feed
      if (mode.type === 'following') {
        if (!user) return null;

        const { data: following } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);

        const ids = following?.map((f) => f.following_id) || [];
        if (ids.length === 0) return { data: [] };

        query = query.in('user_id', ids);
      }

      // Posts by user
      if (mode.type === 'user') {
        query = query.eq('user_id', mode.userId);
      }

      // Posts in a specific collection
      if (mode.type === 'collection') {
        if (!mode.collectionId) return null;

        query = supabase
          .from('saves')
          .select('post_id, posts(*, profiles:user_id (*))')
          .eq('collection_id', mode.collectionId)
          .order('created_at', { ascending: false })
          .range(
            pageNum * POSTS_PER_PAGE,
            pageNum * POSTS_PER_PAGE + POSTS_PER_PAGE - 1
          );
      }

      return query;
    },
    [mode, user]
  );

  const fetchPosts = useCallback(
    async (reset = false) => {
      if (loading) return;
      if (!reset && !hasMore) return;

      const targetPage = reset ? 0 : page;

      setLoading(true);
      try {
        const query = await buildQuery(targetPage);
        if (!query) return;

        const { data, error } = await query;
        if (error) throw error;

        let newPosts = data ?? [];

        if (mode.type === 'collection') {
          newPosts = newPosts.map((row: any) => row.posts).filter(Boolean); // remove nulls
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
    [page, hasMore, loading, buildQuery]
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setHasMore(true);
    setPage(0);
    fetchPosts(true);
  }, [fetchPosts]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) fetchPosts(false);
  }, [loading, hasMore, fetchPosts]);

  useEffect(() => {
    setPosts([]);
    setPage(0);
    setHasMore(true);
    // fresh fetch
    fetchPosts(true);
  }, [mode]);

  return {
    posts,
    loading,
    refreshing,
    hasMore,
    handleRefresh,
    handleLoadMore,
  };
}
