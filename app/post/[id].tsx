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

const { width } = Dimensions.get('window');

export default function PostDetailScreen() {
  const router = useRouter();
  console.log('router', router);
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
      // Fetch post + author
      const { data, error } = await supabase
        .from('posts')
        .select(
          `
          *,
          profiles:user_id (id, username),
          saves:user_id (*)
        `
        )
        .eq('id', postId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return;

      setPost(data);
      setIsLiked(!!data.is_liked);
      setIsSaved(!!data.is_saved);

      // Fetch collections this post is saved in
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('collections')
        .select(
          `
          *,
          user: user_id (username)
        `
        )
        .in('id', data.saves?.map((s: any) => s.collection_id) || []);

      if (collectionsError) throw collectionsError;
      setCollections(collectionsData || []);
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
        await supabase
          .from('likes')
          .insert({ user_id: user.id, post_id: post.id });
      } else {
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', post.id);
      }
    } catch (err) {
      console.error(err);
      setIsLiked(!newState);
    }
  };

  const handleSave = async () => {
    if (!user || !post) return;

    // Placeholder: actual save logic may include selecting a collection
    setIsSaved(!isSaved);
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
    <View style={styles.collectionItem}>
      <View style={styles.collectionThumbnail}>
        {/* Placeholder: use first post in collection or a default image */}
        <Image
          source={{ uri: item.image_url || 'https://via.placeholder.com/100' }}
          style={styles.collectionImage}
        />
      </View>
      <Text style={styles.collectionName}>{item.name}</Text>
      <Text style={styles.collectionUser}>@{item.user.username}</Text>
    </View>
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
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Look</Text>
        <View style={{ width: 24 }} /> {/* Spacer for centering */}
      </View>

      {/* Post Image */}
      <Image source={{ uri: post.image_url }} style={styles.postImage} />

      {/* Like/Save Buttons */}
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

      {/* Caption */}
      {post.caption ? <Text style={styles.caption}>{post.caption}</Text> : null}

      {/* Post Author */}
      <Text style={styles.authorHeading}>@{post.profiles.username}'s look</Text>

      {/* Article/Brand Table */}
      <View style={styles.table}>
        {/* Placeholder rows */}
        {[
          { article: 'Jacket', brand: 'Acne', url: 'https://example.com' },
          { article: 'Sneakers', brand: 'Nike' },
          { article: 'Shirt', brand: 'Nike' },
          { article: 'Pants', brand: 'Levis' },
          { article: 'Socks', brand: 'Zara' },
        ].map((row, i) => (
          <View key={i}>{renderArticleRow(row)}</View>
        ))}
      </View>

      {/* Lookbooks Heading */}
      <Text style={styles.lookbooksHeading}>Lookbooks</Text>

      {/* Collections Grid */}
      <FlatList
        data={collections}
        keyExtractor={(item) => item.id}
        renderItem={renderCollection}
        numColumns={3}
        scrollEnabled={false} // because we’re already in ScrollView
        columnWrapperStyle={styles.columnWrapper}
      />
    </ScrollView>
  );
}

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
  collectionItem: { flex: 1 / 3, margin: 8, alignItems: 'center' },
  collectionThumbnail: {
    width: 100,
    height: 100,
    backgroundColor: '#f5f5f5',
    marginBottom: 4,
  },
  collectionImage: { width: '100%', height: '100%', borderRadius: 8 },
  collectionName: { fontSize: 14, fontWeight: '600' },
  collectionUser: { fontSize: 12, color: '#666' },
  columnWrapper: { justifyContent: 'space-between' },
});
