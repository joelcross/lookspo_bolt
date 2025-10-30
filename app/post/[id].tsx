import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Linking,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, Plus, Check, ArrowLeft } from 'lucide-react-native';
import { Post, Collection } from '@/lib/types';

export default function PostDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const postId = params.id;

  const [post, setPost] = useState<Post | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    if (postId) fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      setLoading(true);

      // Fetch post + author (single row)
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(
          `
          *,
          profiles:user_id (id, username)
        `
        )
        .eq('id', postId)
        .maybeSingle();

      if (postError) throw postError;
      if (!postData) return;

      setPost(postData);

      // Check if current user liked this post
      const { data: likeData, error: likeError } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user?.id)
        .eq('post_id', postId);

      if (likeError) throw likeError;
      setIsLiked((likeData?.length || 0) > 0);

      // Fetch saves for this post
      const { data: savesData, error: savesError } = await supabase
        .from('saves')
        .select('*')
        .eq('post_id', postId);

      if (savesError) throw savesError;

      const saved = (savesData || []).some((s: any) => s.user_id === user?.id);
      setIsSaved(saved);

      // Fetch collections that include this post
      const collectionIds = (savesData || []).map((s: any) => s.collection_id);

      if (collectionIds.length > 0) {
        const { data: collectionsData, error: collectionsError } =
          await supabase
            .from('collections')
            .select(
              `
            *,
            user:user_id (username)
          `
            )
            .in('id', collectionIds);

        if (collectionsError) throw collectionsError;
        setCollections(collectionsData || []);
      } else {
        setCollections([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user || !post) return;

    const newState = !isLiked;
    setIsLiked(newState);

    try {
      if (newState) {
        // Add like
        const { error: likeError } = await supabase
          .from('likes')
          .insert({ user_id: user.id, post_id: post.id });
        if (likeError) throw likeError;

        // Add activity
        const { error: activityError } = await supabase
          .from('activities')
          .insert({
            actor_id: user.id,
            type: 'like',
            post_id: post.id,
            target_user_id: post.user_id,
          });
        if (activityError) throw activityError;
      } else {
        // Remove like
        const { error: unlikeError } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', post.id);
        if (unlikeError) throw unlikeError;

        // Remove activity
        const { error: deleteActivityError } = await supabase
          .from('activities')
          .delete()
          .eq('actor_id', user.id)
          .eq('post_id', post.id)
          .eq('type', 'like');
        if (deleteActivityError) throw deleteActivityError;
      }
    } catch (err) {
      console.error(err);
      setIsLiked(!newState);
    }
  };

  const handleSave = async () => {
    if (!user || !post) return;
    router.push(`/select-collections/${post.id}`);
  };

  const renderArticleRow = (item: {
    article: string;
    brand: string;
    url?: string;
  }) => (
    <View style={styles.tableRow}>
      <Text style={styles.tableCell}>{item.article}</Text>
      {item.url ? (
        <TouchableOpacity
          onPress={() => Linking.openURL(item.url)}
          style={styles.tableCell}
        >
          <Text style={[styles.tableText, { color: 'blue' }]}>
            {item.brand}
          </Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.tableCell}>{item.brand}</Text>
      )}
    </View>
  );

  const renderCollection = ({ item }: { item: Collection }) => (
    <TouchableOpacity
      style={styles.collectionItem}
      onPress={() => router.push(`/collection/${item.id}`)}
    >
      <View style={styles.collectionThumbnail}>
        <Image
          source={{ uri: item.cover_url || 'https://via.placeholder.com/100' }}
          style={styles.collectionImage}
        />
      </View>
      <Text style={styles.collectionName}>{item.name}</Text>
      <Text style={styles.collectionUser}>@{item.user.username}</Text>
    </TouchableOpacity>
  );

  if (loading || !post) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Look</Text>
        <View style={{ width: 24 }} />
      </View>

      <Image source={{ uri: post.image_url }} style={styles.postImage} />

      <View style={styles.actions}>
        <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
          <Heart
            color={isLiked ? '#ff3b30' : '#000'}
            fill={isLiked ? '#ff3b30' : 'none'}
            size={28}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} style={styles.actionButton}>
          {isSaved ? (
            <Check color="#000" size={28} />
          ) : (
            <Plus color="#000" size={28} />
          )}
        </TouchableOpacity>
      </View>

      {post.caption ? <Text style={styles.caption}>{post.caption}</Text> : null}
      <Text style={styles.authorHeading}>@{post.profiles.username}'s look</Text>

      {post.pieces && post.pieces.length > 0 && (
        <View style={styles.table}>
          {post.pieces.map((piece: any, i: number) => (
            <View key={i}>
              {renderArticleRow({
                article: piece.name || piece.article || '',
                brand: piece.brand || '',
                url: piece.url || undefined,
              })}
            </View>
          ))}
        </View>
      )}

      <Text style={styles.lookbooksHeading}>Lookbooks</Text>

      {collections.length ? (
        <FlatList
          data={collections}
          keyExtractor={(item) => item.id}
          renderItem={renderCollection}
          numColumns={3}
          scrollEnabled={false}
          columnWrapperStyle={styles.columnWrapper}
        />
      ) : (
        <Text style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          This look is not saved in any lookbooks yet.
        </Text>
      )}
    </ScrollView>
  );
}

const { width } = Dimensions.get('window');
const columnMargin = 8;
const numColumns = 3;
const columnWidth =
  (width - 16 * 2 - columnMargin * 2 * numColumns) / numColumns;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  topBarTitle: { fontSize: 20, fontWeight: '700' },
  postImage: { width: width, height: width, backgroundColor: '#f5f5f5' },
  actions: { flexDirection: 'row', padding: 16, gap: 16 },
  actionButton: { padding: 4 },
  caption: { paddingHorizontal: 16, fontSize: 16, marginBottom: 12 },
  authorHeading: {
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  table: { paddingHorizontal: 16, marginBottom: 16 },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  tableCell: { flex: 1 },
  tableText: { fontSize: 14 },
  lookbooksHeading: {
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  collectionItem: {
    width: columnWidth,
    margin: columnMargin,
    alignItems: 'center',
  },
  collectionThumbnail: {
    width: columnWidth,
    height: columnWidth,
    backgroundColor: '#f5f5f5',
    marginBottom: 4,
  },
  collectionImage: { width: '100%', height: '100%', borderRadius: 8 },
  collectionName: { fontSize: 14, fontWeight: '600' },
  collectionUser: { fontSize: 12, color: '#666' },
  columnWrapper: {
    justifyContent: 'flex-start',
  },
});
