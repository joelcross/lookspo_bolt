import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Post } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuth } from '@/contexts/AuthContext';
import PostCard from '@/components/PostCard/PostCard';
import SaveModal from '@/components/SaveModal';

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
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

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

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(0);
    setHasMore(true);
    fetchPosts(true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchPosts(false);
    }
  };

  const handleSavePress = (post: Post) => {
    setSelectedPost(post);
    setSaveModalVisible(true);
  };

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      showActions={false} // hide Like/Save buttons in feed
      onLikeToggle={() => fetchPosts(true)}
      onSavePress={() => handleSavePress(item)}
    />
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#000" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {feedType === 'following'
            ? 'Follow users to see their posts here'
            : 'No posts yet'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggle,
              feedType === 'following' && styles.toggleActive,
            ]}
            onPress={() => setFeedType('following')}
          >
            <Text
              style={[
                styles.toggleText,
                feedType === 'following' && styles.toggleTextActive,
              ]}
            >
              Following
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggle,
              feedType === 'explore' && styles.toggleActive,
            ]}
            onPress={() => setFeedType('explore')}
          >
            <Text
              style={[
                styles.toggleText,
                feedType === 'explore' && styles.toggleTextActive,
              ]}
            >
              Explore
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />

      {selectedPost && (
        <SaveModal
          visible={saveModalVisible}
          postId={selectedPost.id}
          postUserId={selectedPost.user_id}
          onClose={() => setSaveModalVisible(false)}
          onSaved={() => fetchPosts(true)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  toggle: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  toggleActive: {
    backgroundColor: '#000',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  toggleTextActive: {
    color: '#fff',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
