import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';
import { Collection, Profile } from '@/lib/types';
import PageHeader from '@/components/PageHeader/PageHeader';
import LookbooksDisplay from '@/components/LookbooksDisplay/LookbooksDisplay';
import { BioCard } from '@/components/BioCard/BioCard';
import { Button } from '../Button/Button';
import styled from 'styled-components/native';
import PostList from '../PostList/PostList';
import { usePosts } from '@/hooks/usePosts';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { PencilIcon, TrashIcon } from 'phosphor-react-native';
import CustomTextInput from '../CustomTextInput/CustomTextInput';

interface ProfileBaseProps {
  isOwnProfile: boolean;
}
const ProfileBase: React.FC<ProfileBaseProps> = ({ isOwnProfile = false }) => {
  const { username: otherUsername } = useLocalSearchParams<{
    username: string;
  }>();
  const { user, profile: ownProfile, refreshProfile } = useAuth();
  const [otherProfile, setOtherProfile] = useState<Profile | null>(null);

  const { edit } = useLocalSearchParams();
  const [isEditing, setIsEditing] = useState(edit === 'true');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [removedCollectionIds, setRemovedCollectionIds] = useState<string[]>(
    []
  );

  const [showModal, setShowModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    username: '',
    bio: '',
    avatar_url: '',
  });
  const [isFollowing, setIsFollowing] = useState(false);
  const [selectedLookbook, setSelectedLookbook] = useState<Collection | null>(
    null
  );

  const targetProfile = isOwnProfile ? ownProfile : otherProfile;

  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [newLookbookName, setNewLookbookName] = useState('');

  const mode = useMemo(() => {
    if (!selectedLookbook) return null;
    return { type: 'collection' as const, collectionId: selectedLookbook.id };
  }, [selectedLookbook]);

  const {
    posts,
    loading: postsLoading,
    refreshing,
    handleLoadMore,
    handleRefresh,
  } = usePosts(mode);

  const fetchOtherProfile = async () => {
    if (!otherUsername || !user) return;

    setLoading(true);
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', otherUsername)
        .maybeSingle();

      if (profileData) {
        setOtherProfile(profileData);

        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', profileData.id)
          .maybeSingle();

        setIsFollowing(!!followData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollections = async () => {
    if (!targetProfile) return;
    setLoading(true);
    const { data } = await supabase
      .from('collections')
      .select('*, user:user_id (username)')
      .eq('user_id', targetProfile.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    // Enrich each collection with up to 4 image URLs
    const collectionsWithImages = await Promise.all(
      (data || []).map(async (col) => {
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

    setCollections(collectionsWithImages);
    setLoading(false);
  };

  // Load data for other user's profile
  useEffect(() => {
    if (!isOwnProfile) {
      fetchOtherProfile();
    }
  }, [otherUsername]);

  // Fetch collections only when profile exists
  useEffect(() => {
    if (targetProfile) {
      fetchCollections();
    }
  }, [targetProfile]);

  // Select first collection by default once they have loaded
  useEffect(() => {
    if (collections.length > 0 && !selectedLookbook) {
      setSelectedLookbook(collections[0]);
    }
  }, [collections]);

  const handleFollowToggle = async () => {
    if (!user || !otherProfile) return;

    const newFollowingState = !isFollowing;
    setIsFollowing(newFollowingState);

    try {
      if (newFollowingState) {
        // Follow
        const { error: followError } = await supabase.from('follows').insert({
          follower_id: user.id,
          following_id: otherProfile.id,
        });
        if (followError) throw followError;

        // Add activity
        const { error: activityError } = await supabase
          .from('activities')
          .insert({
            actor_id: user.id,
            target_user_id: otherProfile.id,
            type: 'follow',
            post_id: null,
          });
        if (activityError) throw activityError;
      } else {
        // Unfollow
        const { error: unfollowError } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', otherProfile.id);
        if (unfollowError) throw unfollowError;

        // Delete follow activity
        const { error: deleteActivityError } = await supabase
          .from('activities')
          .delete()
          .eq('actor_id', user.id)
          .eq('target_user_id', otherProfile.id)
          .eq('type', 'follow');
        if (deleteActivityError) throw deleteActivityError;
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      setIsFollowing(!newFollowingState);
    } finally {
    }
  };

  // Save all changes
  const handleSave = async () => {
    if (!ownProfile) return;
    try {
      // Update profile
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({
          name: form.name,
          username: form.username,
          bio: form.bio,
          avatar_url: form.avatar_url,
        })
        .eq('id', ownProfile.id);
      if (updateProfileError) throw updateProfileError;

      // Delete removed collections
      for (const id of removedCollectionIds) {
        await supabase.from('saves').delete().eq('collection_id', id);
        await supabase.from('collections').delete().eq('id', id);
      }

      // Add any new collections
      for (const c of collections.filter((c) => c.isTemp)) {
        await supabase
          .from('collections')
          .insert({ name: c.name, user_id: ownProfile.id });
      }

      await refreshProfile?.();
      router.push('/profile');
    } catch (err) {
      console.error(err);
      alert('Failed to save profile');
    }
  };

  const handleRenameLookbook = async () => {
    if (!selectedLookbook || !newLookbookName.trim()) return;

    try {
      await supabase
        .from('collections')
        .update({ name: newLookbookName.trim() })
        .eq('id', selectedLookbook.id);

      setCollections((prev) =>
        prev.map((c) =>
          c.id === selectedLookbook.id
            ? { ...c, name: newLookbookName.trim() }
            : c
        )
      );

      setSelectedLookbook((prev) =>
        prev ? { ...prev, name: newLookbookName.trim() } : prev
      );
    } catch (err) {
      console.error('Failed to rename lookbook', err);
    } finally {
      setRenameModalVisible(false);
      setNewLookbookName('');
    }
  };

  const handleDeleteLookbook = async () => {
    if (!selectedLookbook) return;

    try {
      await supabase.from('collections').delete().eq('id', selectedLookbook.id);

      setCollections((prev) =>
        prev.filter((c) => c.id !== selectedLookbook.id)
      );

      setSelectedLookbook(null);
    } catch (err) {
      console.error('Failed to delete lookbook', err);
    } finally {
      setDeleteModalVisible(false);
    }
  };

  if (!targetProfile) {
    return (
      <Container>
        <ActivityIndicator size="large" color="#000" />
      </Container>
    );
  }

  return (
    <Container>
      <PageHeader
        text={`@${targetProfile.username}`}
        left={isOwnProfile ? undefined : 'back'}
        right={isOwnProfile ? 'settings' : undefined}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <BioCard
          image={targetProfile.avatar_url}
          name={targetProfile.name}
          bio={targetProfile.bio}
        >
          <ButtonWrapper>
            {isOwnProfile ? (
              <Button
                title={'Edit Profile'}
                variant={'secondary'}
                onPress={() => router.push('/edit-profile')}
              />
            ) : (
              <Button
                title={isFollowing ? 'Following' : 'Follow'}
                variant={isFollowing ? 'secondary' : 'default'}
                onPress={handleFollowToggle}
              />
            )}
          </ButtonWrapper>
        </BioCard>

        <PostsContent>
          {loading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <LookbooksDisplay
              collections={collections}
              displayMode="carousel"
              hideAuthor
              selectable
              onSelectionChange={(collection) =>
                setSelectedLookbook(collection)
              }
            />
          )}

          <LookbookMetadata>
            <SelectedLookbookTitle>
              {selectedLookbook?.name}
            </SelectedLookbookTitle>
            {isOwnProfile && !selectedLookbook?.is_default && (
              <Icons>
                <Pressable onPress={() => setRenameModalVisible(true)}>
                  <PencilIcon size={18} color={colors.tertiary.dark} />
                </Pressable>
                <Pressable onPress={() => setDeleteModalVisible(true)}>
                  <TrashIcon size={18} color={colors.tertiary.dark} />
                </Pressable>
              </Icons>
            )}
          </LookbookMetadata>

          <PostList
            posts={posts}
            loading={postsLoading}
            refreshing={refreshing}
            emptyText={'No looks to display.'}
            handleLoadMore={handleLoadMore}
            handleRefresh={handleRefresh}
            hideTopBar
          />
        </PostsContent>
        <Modal
          visible={showModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalText}>New Collection</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter collection name"
                value={newCollectionName}
                onChangeText={setNewCollectionName}
                placeholderTextColor="#999"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.createButton]}
                  onPress={async () => {
                    if (!newCollectionName.trim()) return;

                    const tempCollection = {
                      id: `temp-${Date.now()}`,
                      name: newCollectionName.trim(),
                      isTemp: true,
                    };

                    if (isEditing) {
                      // Stage it locally; won't save to DB until user clicks Save
                      setCollections([...collections, tempCollection]);
                    } else {
                      // Immediately insert into DB
                      const { data, error } = await supabase
                        .from('collections')
                        .insert({
                          name: newCollectionName.trim(),
                          user_id: ownProfile.id,
                        })
                        .select()
                        .single();

                      if (error) {
                        alert('Error creating collection: ' + error.message);
                        return;
                      }

                      setCollections([...collections, data]);
                    }

                    setNewCollectionName('');
                    setShowModal(false);
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                    Create
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {renameModalVisible && (
          <Modal transparent animationType="fade" visible={renameModalVisible}>
            <Overlay onPress={() => setRenameModalVisible(false)}>
              <TouchableOpacity activeOpacity={1}>
                <ModalCard>
                  <ModalText>Rename Lookbook</ModalText>
                  <CustomTextInput
                    placeholder="Enter new name"
                    value={newLookbookName}
                    onChangeText={setNewLookbookName}
                    autoFocus
                  />
                  <ButtonRow>
                    <Button
                      title="Cancel"
                      variant="secondary"
                      onPress={() => setRenameModalVisible(false)}
                    />
                    <Button title="Done" onPress={handleRenameLookbook} />
                  </ButtonRow>
                </ModalCard>
              </TouchableOpacity>
            </Overlay>
          </Modal>
        )}

        {deleteModalVisible && (
          <Modal transparent animationType="fade" visible={deleteModalVisible}>
            <Overlay onPress={() => setDeleteModalVisible(false)}>
              <TouchableOpacity activeOpacity={1}>
                <ModalCard>
                  <ModalText>
                    Are you sure you want to delete this lookbook?
                  </ModalText>
                  <ButtonRow>
                    <Button
                      title="Cancel"
                      variant="secondary"
                      onPress={() => setDeleteModalVisible(false)}
                    />
                    <Button title="Delete" onPress={handleDeleteLookbook} />
                  </ButtonRow>
                </ModalCard>
              </TouchableOpacity>
            </Overlay>
          </Modal>
        )}
      </ScrollView>
    </Container>
  );
};

const Container = styled.View`
  flex: 1;
`;

const PostsContent = styled.View`
  background-color: #ffffffff;
  margin: 5px;
  border-radius: 20px;
`;

const LookbookMetadata = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-horizontal: 12px;
  padding-vertical: 8px;
  border-top-width: 1px;
  border-top-color: #eee;
`;

const SelectedLookbookTitle = styled.Text`
  font-family: ${typography.heading3.fontFamily};
  font-size: ${typography.heading3.fontSize}px;
  color: ${colors.secondary.medium};
`;
const ButtonWrapper = styled.View`
  margin-top: 12px;
  width: 100%;
`;

const Icons = styled.View`
  flex-direction: row;
  gap: 8px;
`;

const Overlay = styled.Pressable`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
`;

const ModalCard = styled.View`
  width: 60vw;
  background-color: #fff;
  border-radius: 20px;
  padding: 16px;
`;

const ModalText = styled.Text`
  font-family: ${typography.heading3.fontFamily};
  font-size: ${typography.heading3.fontSize}px;
  text-align: center;
  margin-bottom: 10px;
`;

const ButtonRow = styled.View`
  margin-top: 12px;
  flex-direction: row;
  justify-content: space-between;
  gap: 8px;
`;

const styles = StyleSheet.create({
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignSelf: 'center',
    marginBottom: 20,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  avatarText: { fontSize: 48, color: '#fff', fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  name: { fontSize: 28, fontWeight: '700', textAlign: 'center' },
  username: { textAlign: 'center', color: '#666', marginBottom: 12 },
  bio: { textAlign: 'center', color: '#333', lineHeight: 22 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  collectionTile: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 12,
    flexBasis: '30%',
    position: 'relative',
    alignItems: 'center',
  },
  collectionTileName: { fontWeight: '600' },
  deleteButton: {
    position: 'absolute',
    top: 6,
    right: 6,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  createButton: {
    backgroundColor: '#000',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});

export default ProfileBase;
