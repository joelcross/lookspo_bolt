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
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, Plus, Check, ArrowLeft, Pencil, X } from 'lucide-react-native';
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

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedCaption, setEditedCaption] = useState('');
  const [editedPieces, setEditedPieces] = useState<any[]>([]);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  useEffect(() => {
    if (postId) fetchPost();
  }, [postId]);

  useEffect(() => {
    if (isEditing && post) {
      setEditedCaption(post.caption || '');
      setEditedPieces(post.pieces || []);
    }
  }, [isEditing, post]);

  const handlePieceChange = (index: number, field: string, value: string) => {
    const updated = [...editedPieces];
    updated[index][field] = value;
    setEditedPieces(updated);
  };

  const handleSaveEdits = async () => {
    const trimmedCaption = editedCaption.trim();
    setShowValidationErrors(true);

    // Validate pieces
    for (const piece of editedPieces) {
      if (!piece.name.trim() || !piece.brand.trim()) {
        alert('Each piece must include both a name and a brand.');
        return;
      }
    }

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('posts')
        .update({
          caption: trimmedCaption,
          pieces: editedPieces,
        })
        .eq('id', post.id);

      if (error) throw error;

      setIsEditing(false);
      setShowValidationErrors(false); // reset once successful
      fetchPost();
    } catch (err) {
      console.error(err);
      alert('Error saving post');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdits = () => {
    setIsEditing(false);
  };

  const fetchPost = async () => {
    try {
      setLoading(true);
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

      const { data: likeData } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user?.id)
        .eq('post_id', postId);

      setIsLiked((likeData?.length || 0) > 0);

      const { data: savesData } = await supabase
        .from('saves')
        .select('*')
        .eq('post_id', postId);

      const saved = (savesData || []).some((s: any) => s.user_id === user?.id);
      setIsSaved(saved);

      const collectionIds = (savesData || []).map((s: any) => s.collection_id);

      if (collectionIds.length > 0) {
        const { data: collectionsData } = await supabase
          .from('collections')
          .select('*, user:user_id (username)')
          .in('id', collectionIds);
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
        await supabase
          .from('likes')
          .insert({ user_id: user.id, post_id: post.id });
        await supabase.from('activities').insert({
          actor_id: user.id,
          type: 'like',
          post_id: post.id,
          target_user_id: post.user_id,
        });
      } else {
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', post.id);
        await supabase
          .from('activities')
          .delete()
          .eq('actor_id', user.id)
          .eq('post_id', post.id)
          .eq('type', 'like');
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
    name: string;
    brand: string;
    url?: string;
  }) => (
    <View style={styles.tableRow}>
      <Text style={styles.tableCell}>{item.name}</Text>
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
        {post.user_id === user?.id && !isEditing && (
          <TouchableOpacity
            onPress={() => setIsEditing(true)}
            style={styles.actionButton}
          >
            <Pencil color="#000" size={24} />
          </TouchableOpacity>
        )}
      </View>

      {isEditing ? (
        <>
          <TextInput
            style={styles.editCaptionInput}
            multiline
            value={editedCaption}
            onChangeText={setEditedCaption}
            placeholder="Write a caption..."
          />

          <Text style={styles.sectionTitle}>Pieces</Text>

          {editedPieces.map((piece, i) => (
            <View key={i} style={styles.tableRow}>
              <TextInput
                style={[
                  styles.cellInput,
                  { flex: 2 },
                  showValidationErrors && !piece.name.trim()
                    ? styles.invalidInput
                    : null,
                ]}
                placeholder="Name"
                value={piece.name}
                onChangeText={(t) => handlePieceChange(i, 'name', t)}
              />

              <TextInput
                style={[
                  styles.cellInput,
                  { flex: 2 },
                  showValidationErrors && !piece.brand.trim()
                    ? styles.invalidInput
                    : null,
                ]}
                placeholder="Brand"
                value={piece.brand}
                onChangeText={(t) => handlePieceChange(i, 'brand', t)}
              />
              <TextInput
                style={[styles.cellInput, { flex: 3 }]}
                placeholder="URL (optional)"
                value={piece.url}
                onChangeText={(t) => handlePieceChange(i, 'url', t)}
              />
              <TouchableOpacity
                onPress={() =>
                  setEditedPieces((prev) => prev.filter((_, idx) => idx !== i))
                }
              >
                <X color="#000" size={20} />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={styles.addPieceButton}
            onPress={() =>
              setEditedPieces((prev) => [
                ...prev,
                { name: '', brand: '', url: '' },
              ])
            }
          >
            <Plus color="#000" size={18} />
            <Text style={styles.addPieceText}>Add piece</Text>
          </TouchableOpacity>

          <View style={styles.editActions}>
            <TouchableOpacity
              onPress={handleCancelEdits}
              style={[styles.editButton, { backgroundColor: '#eee' }]}
            >
              <Text style={{ color: '#000' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={isSaving}
              onPress={handleSaveEdits}
              style={[styles.editButton, { backgroundColor: '#000' }]}
            >
              <Text style={{ color: '#fff' }}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          {post.caption ? (
            <Text style={styles.caption}>{post.caption}</Text>
          ) : null}
          <Text style={styles.authorHeading}>
            @{post.profiles.username}'s look
          </Text>

          {post.pieces?.length && (
            <View style={styles.table}>
              {post.pieces.map((piece, i) => (
                <View key={i}>{renderArticleRow(piece)}</View>
              ))}
            </View>
          )}
        </>
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
    alignItems: 'center',
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
  editCaptionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  cellInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    color: '#000',
    marginRight: 4,
  },
  invalidInput: {
    borderColor: 'red',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  editButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  addPieceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 16,
  },
  addPieceText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
});
