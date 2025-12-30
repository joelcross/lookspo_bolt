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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';
import { showConfirmDialog } from '@/lib/showConfirmDialog';
import { Collection, Profile } from '@/lib/types';
import PageHeader from '@/components/PageHeader/PageHeader';
import LookbookList from '@/components/LookbookList/LookbookList';
import { BioCard } from '@/components/BioCard/BioCard';
import { Button } from '../Button/Button';
import styled from 'styled-components/native';
import PostList from '../PostList/PostList';
import { usePosts } from '@/hooks/usePosts';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { DotsThreeIcon } from 'phosphor-react-native';

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
  const [collections, setCollections] = useState([]);
  const [removedCollectionIds, setRemovedCollectionIds] = useState<string[]>(
    []
  );
  const [showModal, setShowModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [originalCollections, setOriginalCollections] = useState<Collection[]>(
    []
  );
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
    setOriginalCollections(collectionsWithImages);
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

  // Pick new avatar
  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      const file = result.assets[0];
      const ext = file.uri.split('.').pop();
      const filePath = `${ownProfile.id}/avatar.${ext}`;
      const { error } = await supabase.storage
        .from('avatars')
        .upload(
          filePath,
          { uri: file.uri, type: file.type || 'image/jpeg', name: filePath },
          { upsert: true }
        );
      if (error) {
        alert('Error uploading avatar: ' + error.message);
      } else {
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        setForm({ ...form, avatar_url: urlData.publicUrl });
      }
    }
  };

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

  // Remove collection locally (staged)
  const removeCollection = async (id: string) => {
    const confirmed = await showConfirmDialog({
      title: 'Remove Collection',
      message:
        'Are you sure you want to remove this collection from your profile?',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      destructive: true,
    });
    if (!confirmed) return;
    setRemovedCollectionIds((prev) => [...prev, id]);
    setCollections((prev) => prev.filter((c) => c.id !== id));
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

  const handleThreeDotsPress = () => {
    // show modal with rename and delete options
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
            <LookbookList
              display="carousel"
              headerText="Lookbooks"
              collections={collections}
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
            {isOwnProfile && <DotsThreeIcon onPress={handleThreeDotsPress} />}
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
              <Text style={styles.modalTitle}>New Collection</Text>
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
  modalTitle: {
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
