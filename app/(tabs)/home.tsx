import React, { useState, useEffect } from 'react';
import { Post } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuth } from '@/contexts/AuthContext';
import styled from 'styled-components/native';
import PillHeader from '@/components/PillHeader/PillHeader';
import PostList from '@/components/PostList/PostList';

type FeedType = 'following' | 'explore';

export default function HomeScreen() {
  const { user } = useAuth();
  useRequireAuth();

  const [feedType, setFeedType] = useState<FeedType>('following');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const POSTS_PER_PAGE = 10;

  useEffect(() => {
    fetchPosts(true);
  }, [feedType, user]);

  const fetchPosts = async (reset = false) => {
    if (!user || (!reset && !hasMore) || loading) return;

    setLoading(true);
    const currentPage = reset ? 0 : page;

    try {
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
          currentPage * POSTS_PER_PAGE,
          (currentPage + 1) * POSTS_PER_PAGE - 1
        );

      if (feedType === 'following') {
        const { data: followingData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);

        const followingIds = followingData?.map((f) => f.following_id) || [];

        if (followingIds.length === 0) {
          setPosts([]);
          setHasMore(false);
          setLoading(false);
          return;
        }

        query = query.in('user_id', followingIds);
      }

      const { data, error } = await query;

      if (error) throw error;

      const postsWithStatus = await Promise.all(
        (data || []).map(async (post) => {
          const { data: likeData } = await supabase
            .from('likes')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', user.id)
            .maybeSingle();

          const { data: saveData } = await supabase
            .from('saves')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', user.id)
            .maybeSingle();

          return {
            ...post,
            is_liked: !!likeData,
            is_saved: !!saveData,
          };
        })
      );

      if (reset) {
        setPosts(postsWithStatus);
      } else {
        setPosts([...posts, ...postsWithStatus]);
      }

      setHasMore((data || []).length === POSTS_PER_PAGE);
      setPage(reset ? 1 : currentPage + 1);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchPosts(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(0);
    setHasMore(true);
    fetchPosts(true);
  };

  return (
    <Container>
      <PillHeader
        options={[
          { label: 'Following', value: 'following' },
          { label: 'Explore', value: 'explore' },
        ]}
        value={feedType}
        onChange={setFeedType}
      />

      <PostList
        posts={posts}
        handleLoadMore={handleLoadMore}
        handleRefresh={handleRefresh}
        refreshing={refreshing}
        loading={loading}
        emptyText={
          feedType === 'following'
            ? 'Follow users to see their posts here'
            : 'No posts yet'
        }
      />
    </Container>
  );
}

const Container = styled.SafeAreaView`
  flex: 1;
`;
