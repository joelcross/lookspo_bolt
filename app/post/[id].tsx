import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  View,
  Text,
  Modal,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, X } from 'lucide-react-native';
import { Post, Collection } from '@/lib/types';
import PostCard from '@/components/PostCard';
import PageHeader from '@/components/PageHeader/PageHeader';
import PiecesCard from '@/components/PiecesCard/PiecesCard';
import LookbookCarousel from '@/components/LookbookCarousel/LookbookCarousel';
import SaveModal from '@/components/SaveModal/SaveModal';
import styled from 'styled-components/native';
import { typography } from '@/theme/typography';
import { Button } from '@/components/Button/Button';
import { colors } from '@/theme/colors';

export default function PostDetailScreen() {
  const { id: postId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedCollections, setSavedCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editedCaption, setEditedCaption] = useState('');
  const [editedPieces, setEditedPieces] = useState<any[]>([]);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [isSavingEdits, setIsSavingEdits] = useState(false);

  const isOwnPost = post?.user_id === user.id;
  const router = useRouter();

  // Fetch post + likes + saves + collections in ONE optimized query
  useEffect(() => {
    if (!postId || !user) return;
    fetchEverything();
  }, [postId, user]);

  const fetchEverything = async () => {
    try {
      setLoading(true);

      // 1. Main post + author
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(`*, profiles:user_id (id, username, avatar_url)`)
        .eq('id', postId)
        .single();

      if (postError || !postData)
        throw postError || new Error('Post not found');

      setPost(postData);

      // 2. Is current user liking?
      const { count: likeCount } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('post_id', postId);

      setIsLiked(!!likeCount && likeCount > 0);

      // 3. Get saves + collections in ONE query
      const { data: savesData } = await supabase
        .from('saves')
        .select(
          `
          collection_id,
          collections!collection_id (
            id,
            name,
            user:user_id (username)
          )`
        )
        .eq('post_id', postId);

      // 4. Is this post saved by current user?
      const { count: userSaveCount } = await supabase
        .from('saves')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('post_id', postId);

      setIsSaved(!!userSaveCount && userSaveCount > 0);

      // 5. Extract base collection objects
      const baseCollections = (savesData || [])
        .map((s) => s.collections)
        .filter(Boolean);

      // 6. Enrich each collection with collage images + post count
      const enrichedCollections = await Promise.all(
        baseCollections.map(async (col) => {
          const { data: images, count } = await supabase
            .from('saves')
            .select('posts(image_url)', { count: 'exact' })
            .eq('collection_id', col.id)
            .order('created_at', { ascending: true })
            .limit(4);

          return {
            ...col,
            cover_images: images?.map((i) => i.posts.image_url) || [],
            post_count: count || 0,
          };
        })
      );

      setSavedCollections(enrichedCollections);
    } catch (err) {
      console.error('Error loading post:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!post) return;

    try {
      await supabase.from('posts').delete().eq('id', post.id);

      // Delete related saves + likes automatically handled if your DB has cascade rules.
      // If not, delete them manually here.

      setDeleteModalVisible(false);

      // Go back to feed / profile
      router.back();
    } catch (err) {
      console.error('Failed to delete post', err);
    }
  };

  // Toggle like
  const handleLike = async () => {
    if (!user || !post) return;

    const willLike = !isLiked;
    setIsLiked(willLike);

    try {
      if (willLike) {
        await supabase.from('likes').insert({
          user_id: user.id,
          post_id: post.id,
        });
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
      }
    } catch (err) {
      setIsLiked(!willLike);
      console.error('Like failed:', err);
    }
  };

  // Edit mode setup
  useEffect(() => {
    if (isEditing && post) {
      setEditedCaption(post.caption || '');
      setEditedPieces(post.pieces || []);
    }
  }, [isEditing, post]);

  const handleSaveEdits = async () => {
    if (!post) return;

    const trimmed = editedCaption.trim();
    const validPieces = editedPieces.every(
      (p) => p.name.trim() && p.brand.trim()
    );

    if (!validPieces) {
      setShowValidationErrors(true);
      return;
    }

    try {
      setIsSavingEdits(true);
      const { error } = await supabase
        .from('posts')
        .update({ caption: trimmed, pieces: editedPieces })
        .eq('id', post.id);

      if (error) throw error;

      setIsEditing(false);
      setShowValidationErrors(false);
      fetchEverything(); // refresh
    } catch (err) {
      alert('Failed to save changes');
    } finally {
      setIsSavingEdits(false);
    }
  };

  if (loading || !post) {
    return (
      <Container>
        <ActivityIndicator size="large" color="#000" />
      </Container>
    );
  }

  return (
    <Container showsVerticalScrollIndicator={false}>
      <PageHeader
        text="Look"
        left="back"
        right={isOwnPost ? 'trash' : undefined}
        onCustomPress={() => setDeleteModalVisible(true)}
      />

      <Content>
        <PostCardWrapper>
          <PostCard
            post={post}
            onLikeToggle={handleLike}
            onSavePress={() => setSaveModalVisible(true)}
            showActions
            isLiked={isLiked}
            isSaved={isSaved}
          />
        </PostCardWrapper>

        {/* Edit Mode */}
        {isEditing ? (
          <>
            <TextInput
              multiline
              value={editedCaption}
              onChangeText={setEditedCaption}
              placeholder="Write a caption..."
              style={styles.editInput}
            />

            {editedPieces.map((piece, i) => (
              <View key={i} style={styles.pieceRow}>
                <TextInput
                  placeholder="Name"
                  value={piece.name}
                  onChangeText={(t) => {
                    const updated = [...editedPieces];
                    updated[i].name = t;
                    setEditedPieces(updated);
                  }}
                  style={[
                    styles.pieceInput,
                    showValidationErrors &&
                      !piece.name.trim() &&
                      styles.invalid,
                  ]}
                />
                <TextInput
                  placeholder="Brand"
                  value={piece.brand}
                  onChangeText={(t) => {
                    const updated = [...editedPieces];
                    updated[i].brand = t;
                    setEditedPieces(updated);
                  }}
                  style={[
                    styles.pieceInput,
                    showValidationErrors &&
                      !piece.brand.trim() &&
                      styles.invalid,
                  ]}
                />
                <TouchableOpacity
                  onPress={() =>
                    setEditedPieces((prev) =>
                      prev.filter((_, idx) => idx !== i)
                    )
                  }
                >
                  <X size={20} color="#999" />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addPieceBtn}
              onPress={() =>
                setEditedPieces((prev) => [
                  ...prev,
                  { name: '', brand: '', url: '' },
                ])
              }
            >
              <Plus size={18} color="#000" />
              <Text style={styles.addPieceText}>Add piece</Text>
            </TouchableOpacity>

            <View style={styles.editActions}>
              <TouchableOpacity
                onPress={() => setIsEditing(false)}
                style={styles.cancelBtn}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveEdits}
                disabled={isSavingEdits}
                style={styles.saveBtn}
              >
                <Text style={{ color: '#fff' }}>
                  {isSavingEdits ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {post.pieces?.length > 0 && <PiecesCard pieces={post.pieces} />}

            {savedCollections.length > 0 && (
              <LookbookCarouselWrapper>
                <HeadingText>Featured In</HeadingText>
                <LookbookCarousel
                  collections={savedCollections}
                  displayMode="carousel"
                />
              </LookbookCarouselWrapper>
            )}
          </>
        )}
      </Content>

      <SaveModal
        visible={saveModalVisible}
        onClose={() => setSaveModalVisible(false)}
        post={post}
        currentCollectionIds={savedCollections.map((c) => c.id)}
        onSaved={() => {
          setSaveModalVisible(false);
          fetchEverything();
        }}
      />
      {deleteModalVisible && (
        <Modal transparent animationType="fade" visible={deleteModalVisible}>
          <Overlay onPress={() => setDeleteModalVisible(false)}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <ModalCard>
                <ModalTitle>Delete this post?</ModalTitle>

                <ButtonRow>
                  <Button
                    title="Cancel"
                    onPress={() => setDeleteModalVisible(false)}
                    variant="text"
                  />
                  <Button title="Delete" onPress={handleDeletePost} />
                </ButtonRow>
              </ModalCard>
            </Pressable>
          </Overlay>
        </Modal>
      )}
    </Container>
  );
}

const Container = styled.ScrollView`
  flex: 1;
`;

const Content = styled.View`
  gap: 5px;
  padding-bottom: 40px;
`;

const PostCardWrapper = styled.View`
  margin-horizontal: 5px;
`;

const LookbookCarouselWrapper = styled.View`
  background-color: #ffffffff;
  margin-horizontal: 5px;
  border-radius: 20px;
`;

const HeadingText = styled.Text`
  font-family: ${typography.heading3.fontFamily};
  font-size: ${typography.heading3.fontSize}px;
  color: ${colors.secondary.medium};
  padding: 12px;
`;

// Delete modal
const Overlay = styled.Pressable`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
`;

const ModalCard = styled.View`
  width: 80vw;
  background-color: #fff;
  border-radius: 16px;
  padding: 16px;
  shadow-color: #000;
  shadow-offset: 0px 10px;
  shadow-opacity: 0.15;
  shadow-radius: 20px;
  elevation: 15;
`;

const ModalTitle = styled.Text`
  font-family: ${typography.heading3.fontFamily};
  font-size: ${typography.heading3.fontSize}px;
  text-align: center;
  margin-bottom: 20px;
`;

const ButtonRow = styled.View`
  margin-top: 12px;
  flex-direction: row;
  justify-content: space-between;
  gap: 12px;
`;

const styles = {
  editInput: {
    marginHorizontal: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    fontSize: 16,
  },
  pieceRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  pieceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  invalid: { borderColor: 'red' },
  addPieceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    marginTop: 8,
  },
  addPieceText: { marginLeft: 8, fontWeight: '500' },
  editActions: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    backgroundColor: '#eee',
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtn: {
    flex: 1,
    padding: 14,
    backgroundColor: '#000',
    borderRadius: 12,
    alignItems: 'center',
  },
};
