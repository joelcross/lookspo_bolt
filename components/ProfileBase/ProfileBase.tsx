import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
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
import Bridge from '../Bridge/Bridge';

interface ProfileBaseProps {
  isOwnProfile: boolean;
}
const ProfileBase: React.FC<ProfileBaseProps> = ({ isOwnProfile = false }) => {
  const { username: otherUsername } = useLocalSearchParams<{
    username: string;
  }>();
  const { user, profile: ownProfile, refreshProfile } = useAuth();
  const [otherProfile, setOtherProfile] = useState<Profile | null>(null);

  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [selectedLookbook, setSelectedLookbook] = useState<Collection | null>(
    null,
  );

  const targetProfile = isOwnProfile ? ownProfile : otherProfile;

  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [newLookbookName, setNewLookbookName] = useState('');

  // Only initialize hook once
  const {
    posts,
    loading: postsLoading,
    refreshing,
    handleLoadMore,
    handleRefresh,
    fetchPosts,
  } = usePosts({ type: 'user', userId: targetProfile?.id ?? '' });

  // When switching collections:
  useEffect(() => {
    if (!targetProfile) return;

    if (selectedLookbook) {
      fetchPosts(
        { type: 'collection', collectionId: selectedLookbook.id },
        true,
      );
    } else {
      fetchPosts({ type: 'user', userId: targetProfile.id }, true);
    }
  }, [targetProfile, selectedLookbook]);

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
      }),
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
            : c,
        ),
      );

      setSelectedLookbook((prev) =>
        prev ? { ...prev, name: newLookbookName.trim() } : prev,
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
        prev.filter((c) => c.id !== selectedLookbook.id),
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

      <PostsContent>
        <PostList
          posts={posts}
          loading={postsLoading}
          refreshing={refreshing}
          emptyText="No looks to display."
          handleLoadMore={handleLoadMore}
          handleRefresh={handleRefresh}
          hideTopBar
          transparentBackground
          ListHeaderComponent={
            <>
              <BioCard
                image={targetProfile.avatar_url}
                name={targetProfile.name}
                bio={targetProfile.bio}
              >
                <BioButtonWrapper>
                  {isOwnProfile ? (
                    <Button
                      title="Edit Profile"
                      variant="secondary"
                      onPress={() => router.push('/edit-profile')}
                    />
                  ) : (
                    <Button
                      title={isFollowing ? 'Following' : 'Follow'}
                      variant={isFollowing ? 'secondary' : 'default'}
                      onPress={handleFollowToggle}
                    />
                  )}
                </BioButtonWrapper>
              </BioCard>

              <View style={{ marginTop: 5 }}>
                {loading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <LookbooksDisplay
                    collections={collections}
                    displayMode="carousel"
                    hideAuthor
                    selectable
                    onSelectionChange={setSelectedLookbook}
                  />
                )}
              </View>

              <Bridge />

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
            </>
          }
        />
      </PostsContent>

      {renameModalVisible && (
        <Modal transparent animationType="fade" visible={renameModalVisible}>
          <Overlay onPress={() => setRenameModalVisible(false)}>
            <TouchableOpacity activeOpacity={1}>
              <ModalCard>
                <ModalText>Rename Lookbook</ModalText>
                <ModalTextInputWrapper>
                  <CustomTextInput
                    placeholder="Enter new name"
                    value={newLookbookName}
                    onChangeText={setNewLookbookName}
                    autoFocus
                  />
                </ModalTextInputWrapper>
                <ButtonRow>
                  <ModalButtonWrapper>
                    <Button
                      title="Cancel"
                      variant="secondary"
                      onPress={() => setRenameModalVisible(false)}
                    />
                  </ModalButtonWrapper>
                  <ModalButtonWrapper>
                    <Button title="Done" onPress={handleRenameLookbook} />
                  </ModalButtonWrapper>
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
                  <ModalButtonWrapper>
                    <Button
                      title="Cancel"
                      variant="secondary"
                      onPress={() => setDeleteModalVisible(false)}
                    />
                  </ModalButtonWrapper>
                  <ModalButtonWrapper>
                    <Button title="Delete" onPress={handleDeleteLookbook} />
                  </ModalButtonWrapper>
                </ButtonRow>
              </ModalCard>
            </TouchableOpacity>
          </Overlay>
        </Modal>
      )}
    </Container>
  );
};

const Container = styled.View`
  flex: 1;
`;

const ScrollableContent = styled.ScrollView`
  flex: 1;
  margin-horizontal: 5px;
  border-radius: 20px;
`;

const PostsContent = styled.View`
  border-radius: 20px;
  flex: 1;
`;

const LookbookMetadata = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-horizontal: 12px;
  padding-vertical: 8px;
`;

const SelectedLookbookTitle = styled.Text`
  font-family: ${typography.heading3.fontFamily};
  font-size: ${typography.heading3.fontSize}px;
  color: ${colors.primary[900]};
`;
const BioButtonWrapper = styled.View`
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

const ModalButtonWrapper = styled.View`
  flex: 1;
`;

const ModalTextInputWrapper = styled.View`
  margin-bottom: 24px;
`;

const ModalCard = styled.View`
  width: 85vw;
  background-color: #fff;
  border-radius: 20px;
  padding: 16px;
`;

const ModalText = styled.Text`
  font-family: ${typography.heading3.fontFamily};
  font-size: ${typography.heading3.fontSize}px;
  font-weight: ${typography.heading3.fontWeight};
  text-align: center;
  margin-bottom: 12px;
`;

const ButtonRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  gap: 8px;
`;

export default ProfileBase;
