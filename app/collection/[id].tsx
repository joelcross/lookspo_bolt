import React, { useState, useEffect } from 'react';
import { Modal, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Collection } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import PageHeader from '@/components/PageHeader/PageHeader';
import styled from 'styled-components/native';
import { typography } from '@/theme/typography';
import { Button } from '@/components/Button/Button';
import { colors } from '@/theme/colors';
import CustomTextInput from '@/components/CustomTextInput/CustomTextInput';
import { usePosts } from '@/hooks/usePosts';
import PostList from '@/components/PostList/PostList';

export default function CollectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [deleteModalVisible, setdeleteModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const isOwnCollection = collection?.user_id === user.id;

  const { posts, loading, refreshing, handleLoadMore, handleRefresh } =
    usePosts(id ? { type: 'collection', collectionId: id } : { type: 'all' });

  const handleCustomPress = () => setMenuVisible(true);

  const handleDelete = () => setdeleteModalVisible(true);

  const handleRename = async () => {
    if (!newCollectionName.trim()) return;

    try {
      await supabase
        .from('collections')
        .update({ name: newCollectionName.trim() })
        .eq('id', collection.id);

      setCollection(
        (prev) => prev && { ...prev, name: newCollectionName.trim() },
      );
    } catch (err) {
      console.error('Failed to rename collection', err);
    } finally {
      setRenameModalVisible(false);
    }
  };

  useEffect(() => {
    fetchCollection();
  }, [id]);

  const fetchCollection = async () => {
    if (!id || !user) return;

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
          }),
        );

        //setPosts(postsWithStatus.filter(Boolean) as Post[]);
      }
    } catch (error) {
      console.error('Error fetching collection:', error);
    } finally {
      //setLoading(false);
    }
  };

  const handleDeleteCollection = async () => {
    try {
      await supabase.from('collections').delete().eq('id', collection.id);

      router.push('/profile');
    } catch (err) {
      console.error('Failed to delete collection:', err);
    } finally {
      setdeleteModalVisible(false);
    }
  };

  return (
    collection && (
      <Container>
        <PageHeader
          text={collection.name}
          left="back"
          right={isOwnCollection ? 'more' : undefined}
          onCustomPress={handleCustomPress}
        />
        <ContentWrapper showsVerticalScrollIndicator={false}>
          <PostList
            posts={posts}
            loading={loading}
            refreshing={refreshing}
            emptyText={'This lookbook is empty.'}
            handleLoadMore={handleLoadMore}
            handleRefresh={handleRefresh}
          />
        </ContentWrapper>

        {/* Three vertical dots dropdown */}
        {menuVisible && (
          <Modal transparent animationType="none" visible={menuVisible}>
            <DropdownOverlay onPress={() => setMenuVisible(false)}>
              <Pressable onPress={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <MenuItem
                    onPress={() => {
                      setRenameModalVisible(true);
                      setMenuVisible(false);
                    }}
                  >
                    <RenameText>Rename</RenameText>
                  </MenuItem>
                  <MenuItem
                    onPress={() => {
                      handleDelete();
                      setMenuVisible(false);
                    }}
                  >
                    <DeleteText>Delete</DeleteText>
                  </MenuItem>
                </DropdownMenu>
              </Pressable>
            </DropdownOverlay>
          </Modal>
        )}

        {/* Rename modal */}
        {renameModalVisible && (
          <Modal transparent animationType="fade" visible={renameModalVisible}>
            <Overlay onPress={() => setRenameModalVisible(false)}>
              <Pressable onPress={(e) => e.stopPropagation()}>
                <ModalCard>
                  <ModalTitle>Rename Collection</ModalTitle>
                  <TextInputWrapper>
                    <CustomTextInput
                      placeholder="Enter new collection name"
                      value={newCollectionName}
                      onChangeText={setNewCollectionName}
                      autoFocus
                    />
                  </TextInputWrapper>
                  <ButtonRow>
                    <ButtonWrapper>
                      <Button
                        title="Cancel"
                        variant="secondary"
                        onPress={() => setRenameModalVisible(false)}
                      />
                    </ButtonWrapper>
                    <ButtonWrapper>
                      <Button title="Done" onPress={handleRename} />
                    </ButtonWrapper>
                  </ButtonRow>
                </ModalCard>
              </Pressable>
            </Overlay>
          </Modal>
        )}

        {/* Delete modal */}
        {deleteModalVisible && (
          <Modal transparent animationType="fade" visible={deleteModalVisible}>
            <Overlay onPress={() => setdeleteModalVisible(false)}>
              <ModalCard onPress={(e) => e.stopPropagation()}>
                <ModalTitle>
                  Are you sure you want to delete this collection?
                </ModalTitle>
                <ButtonRow>
                  <ButtonWrapper>
                    <Button
                      title="Cancel"
                      variant="secondary"
                      onPress={() => setdeleteModalVisible(false)}
                    />
                  </ButtonWrapper>
                  <ButtonWrapper>
                    <Button title="Delete" onPress={handleDeleteCollection} />
                  </ButtonWrapper>
                </ButtonRow>
              </ModalCard>
            </Overlay>
          </Modal>
        )}
      </Container>
    )
  );
}

const Container = styled.View`
  flex: 1;
`;

const ContentWrapper = styled.ScrollView`
  margin: 60px 5px 5px 5px;
  background-color: #fff;
  flex: 1;
  border-radius: 20px;
  padding-vertical: 5px;
`;

// Modal components
const DropdownOverlay = styled.Pressable`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.2);
  justify-content: flex-start;
  align-items: flex-end;
`;

const DropdownMenu = styled.View`
  margin-top: 44px;
  margin-right: 10px;
  padding-vertical: 5px;
  background-color: white;
  border-radius: 20px;
  overflow: hidden;
  min-width: 140px;
  elevation: 10;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.15;
  shadow-radius: 4px;
`;

const MenuItem = styled.TouchableOpacity`
  padding: 12px 16px;
  flex-direction: row;
  align-items: center;
`;

const RenameText = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.text.primary};
`;

const DeleteText = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.feedback.error};
`;

const Overlay = styled.Pressable`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
`;

const ModalCard = styled.View`
  width: 85vw;
  background-color: #fff;
  border-radius: 20px;
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
  font-weight: ${typography.heading3.fontWeight};
  color: ${colors.primary[900]};
  text-align: center;
  margin-bottom: 12px;
`;

const TextInputWrapper = styled.View`
  margin-bottom: 24px;
`;

const ButtonRow = styled.View`
  flex-direction: row;
  gap: 5px;
`;

const ButtonWrapper = styled.View`
  flex: 1;
`;
