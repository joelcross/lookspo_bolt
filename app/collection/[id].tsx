import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Post, Collection } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import PostCard from '@/components/PostCard/PostCard';
import SaveModal from '@/components/SaveModal';
import Header from '@/components/Header/Header';
import styled from 'styled-components/native';

export default function CollectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    fetchCollection();
  }, [id]);

  const fetchCollection = async () => {
    if (!id || !user) return;

    setLoading(true);
    try {
      const { data: collectionData } = await supabase
        .from('collections')
        .select('*, user:user_id (username)')
        .eq('id', id)
        .maybeSingle();

      if (collectionData) {
        setCollection(collectionData);

        const { data: savesData } = await supabase
          .from('saves')
          .select(`post_id, posts(*, profiles:user_id (*))`)
          .eq('collection_id', id)
          .order('created_at', { ascending: false });

        const postsWithStatus = await Promise.all(
          (savesData || []).map(async (save: any) => {
            const post = save.posts;
            if (!post) return null;

            const { data: likeData } = await supabase
              .from('likes')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .maybeSingle();

            return {
              ...post,
              is_liked: !!likeData,
              is_saved: true,
            };
          })
        );

        setPosts(postsWithStatus.filter(Boolean) as Post[]);
      }
    } catch (error) {
      console.error('Error fetching collection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePress = (post: Post) => {
    setSelectedPost(post);
    setSaveModalVisible(true);
  };

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      showActions={false}
      onLikeToggle={fetchCollection}
      onSavePress={() => handleSavePress(item)}
    />
  );

  if (loading) {
    return (
      <Container style={styles.container}>
        <ActivityIndicator size="large" color="#000" />
      </Container>
    );
  }

  if (!collection) {
    return (
      <Container style={styles.container}>
        <Text style={styles.errorText}>Collection not found</Text>
      </Container>
    );
  }

  return (
    <Container style={styles.container} edges={['top']}>
      <Header text={collection.name} left="back" />
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No posts in this collection</Text>
          </View>
        }
      />

      {selectedPost && (
        <SaveModal
          visible={saveModalVisible}
          postId={selectedPost.id}
          postUserId={selectedPost.user_id}
          onClose={() => setSaveModalVisible(false)}
          onSaved={fetchCollection}
        />
      )}
    </Container>
  );
}

const Container = styled.SafeAreaView`
  gap: 10px;
`;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
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
