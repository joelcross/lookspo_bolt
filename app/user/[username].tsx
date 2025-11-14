import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Profile, Collection } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header/Header';

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { user, profile: currentUserProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = currentUserProfile?.username === username;

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    if (!username || !user) return;

    setLoading(true);
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);

        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', profileData.id)
          .maybeSingle();

        setIsFollowing(!!followData);

        const { data: collectionsData } = await supabase
          .from('collections')
          .select('*')
          .eq('user_id', profileData.id)
          .order('created_at', { ascending: false });

        const collectionsWithCount = await Promise.all(
          (collectionsData || []).map(async (collection) => {
            const { count } = await supabase
              .from('saves')
              .select('*', { count: 'exact', head: true })
              .eq('collection_id', collection.id);

            return {
              ...collection,
              post_count: count || 0,
            };
          })
        );

        setCollections(collectionsWithCount);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!user || !profile || followLoading) return;

    setFollowLoading(true);
    const newFollowingState = !isFollowing;
    setIsFollowing(newFollowingState);

    try {
      if (newFollowingState) {
        // Follow
        const { error: followError } = await supabase.from('follows').insert({
          follower_id: user.id,
          following_id: profile.id,
        });
        if (followError) throw followError;

        // Add activity
        const { error: activityError } = await supabase
          .from('activities')
          .insert({
            actor_id: user.id,
            target_user_id: profile.id,
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
          .eq('following_id', profile.id);
        if (unfollowError) throw unfollowError;

        // Delete follow activity
        const { error: deleteActivityError } = await supabase
          .from('activities')
          .delete()
          .eq('actor_id', user.id)
          .eq('target_user_id', profile.id)
          .eq('type', 'follow');
        if (deleteActivityError) throw deleteActivityError;
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      setIsFollowing(!newFollowingState);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft color="#000" size={28} />
          </TouchableOpacity>
        </View>
        <Text style={styles.errorText}>User not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header text="Profile" left="back" />
      <Text style={styles.headerTitle}>@{profile.username}</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.username}>@{profile.username}</Text>

          <View style={styles.avatarContainer}>
            {profile.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {profile.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {profile.bio ? (
            <Text style={styles.bio}>{profile.bio}</Text>
          ) : (
            <Text style={styles.bioPlaceholder}>No bio</Text>
          )}

          {!isOwnProfile && (
            <TouchableOpacity
              style={[
                styles.followButton,
                isFollowing && styles.followingButton,
              ]}
              onPress={handleFollowToggle}
              disabled={followLoading}
            >
              {followLoading ? (
                <ActivityIndicator
                  size="small"
                  color={isFollowing ? '#000' : '#fff'}
                />
              ) : (
                <Text
                  style={[
                    styles.followButtonText,
                    isFollowing && styles.followingButtonText,
                  ]}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.collectionsSection}>
          <Text style={styles.sectionTitle}>Collections</Text>

          {collections.length === 0 ? (
            <Text style={styles.emptyText}>No collections yet</Text>
          ) : (
            <View style={styles.collectionsList}>
              {collections.map((collection) => (
                <TouchableOpacity
                  key={collection.id}
                  style={styles.collectionItem}
                  onPress={() => router.push(`/collection/${collection.id}`)}
                >
                  <View>
                    <Text style={styles.collectionName}>{collection.name}</Text>
                    <Text style={styles.collectionCount}>
                      {collection.post_count || 0} post
                      {collection.post_count !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  profileSection: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#f5f5f5',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  avatarText: {
    fontSize: 72,
    fontWeight: '700',
    color: '#fff',
  },
  bio: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  bioPlaceholder: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  followButton: {
    backgroundColor: '#000',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    minWidth: 120,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#000',
  },
  collectionsSection: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  collectionsList: {
    gap: 12,
  },
  collectionItem: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  collectionName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  collectionCount: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
});
