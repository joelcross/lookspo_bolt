import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, X } from 'lucide-react-native';
import { Post, Collection } from '@/lib/types';
import PostCard from '@/components/PostCard';
import Header from '@/components/Header/Header';
import PiecesCard from '@/components/PiecesCard/PiecesCard';
import { colors } from '@/theme/colors';
import styled from 'styled-components/native';
import LookbookCarousel from '@/components/LookbookCarousel/LookbookCarousel';
import SaveModal from '@/components/SaveModal/SaveModal';

export default function PostDetailScreen() {
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
  const [saveModalVisible, setSaveModalVisible] = useState(false);

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
          profiles:user_id (id, username, avatar_url)
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

  if (loading || !post) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <Container>
      <Header text="Look" left="back" />

      <Content>
        <PostCard
          post={post}
          onLikeToggle={handleLike}
          onSavePress={() => setSaveModalVisible(true)}
          showActions
          isSaved={isSaved}
          isLiked={isLiked}
        />

        {isEditing && (
          <>
            <TextInput
              style={styles.editCaptionInput}
              multiline
              value={editedCaption}
              onChangeText={setEditedCaption}
              placeholder="Write a caption..."
            />

            <Text>Pieces</Text>

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
                    setEditedPieces((prev) =>
                      prev.filter((_, idx) => idx !== i)
                    )
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
        )}

        {/* Pieces Card */}
        {post.pieces?.length > 0 && <PiecesCard pieces={post.pieces} />}

        {/* Collections Carousel */}
        {collections.length > 0 && (
          <LookbookCarousel collections={collections} />
        )}
      </Content>

      {/* Save to Lookbooks Modal */}
      <SaveModal
        visible={saveModalVisible}
        onClose={() => setSaveModalVisible(false)}
        postId={post.id}
        currentCollectionIds={collections.map((c) => c.id)}
        onSaved={() => {
          setSaveModalVisible(false);
          fetchPost(); // refresh to update green icon + carousel
        }}
      />
    </Container>
  );
}

const { width } = Dimensions.get('window');
const columnMargin = 8;
const numColumns = 3;
const columnWidth =
  (width - 16 * 2 - columnMargin * 2 * numColumns) / numColumns;

const Container = styled.ScrollView`
  flex: 1;
  background-color: ${colors.primary[100]};
`;

const Content = styled.View`
  row-gap: 16px;
`;

const styles = StyleSheet.create({
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
