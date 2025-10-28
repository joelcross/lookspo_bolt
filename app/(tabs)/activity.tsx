import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Activity } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

type ActivityFeedType = 'you' | 'following' | 'all';

export default function ActivityScreen() {
  const { user } = useAuth();
  const [feedType, setFeedType] = useState<ActivityFeedType>('you');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, [feedType, user]);

  const fetchActivities = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('activities')
        .select(
          `
          *,
          actor:actor_id (*),
          post:post_id (
            id,
            image_url,
            user_id,
            profiles:user_id (username)
          ),
          collection:collection_id (
            id,
            name
          )
        `
        )
        .order('created_at', { ascending: false })
        .limit(50);

      if (feedType === 'you') {
        query = query.eq('target_user_id', user.id).neq('actor_id', user.id);
      } else if (feedType === 'following') {
        const { data: followingData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);

        const followingIds = followingData?.map((f) => f.following_id) || [];

        if (followingIds.length === 0) {
          setActivities([]);
          setLoading(false);
          return;
        }

        query = query.in('actor_id', followingIds);
      }

      const { data, error } = await query;
      if (error) throw error;

      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchActivities();
  };

  const getActivityText = (activity: Activity) => {
    const actorUsername = activity.actor?.username || 'Someone';
    const collectionName = activity.collection?.name;

    switch (activity.type) {
      case 'like':
        if (feedType === 'you') {
          return `@${actorUsername} liked your post`;
        } else {
          const targetUsername = activity.post?.profiles?.username || 'a post';
          return `@${actorUsername} liked @${targetUsername}'s post`;
        }
      case 'save':
        if (feedType === 'you') {
          return collectionName
            ? `@${actorUsername} saved your post to "${collectionName}"`
            : `@${actorUsername} saved your post`;
        } else {
          const targetUsername = activity.post?.profiles?.username || 'a post';
          return collectionName
            ? `@${actorUsername} saved @${targetUsername}'s post to "${collectionName}"`
            : `@${actorUsername} saved @${targetUsername}'s post`;
        }
      case 'follow':
        if (feedType === 'you') {
          return `@${actorUsername} started following you`;
        } else {
          return `@${actorUsername} followed someone`;
        }
      default:
        return '';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
  };

  const renderActivity = ({ item }: { item: Activity }) => (
    <TouchableOpacity
      style={styles.activityItem}
      onPress={() => {
        if (item.type === 'follow') {
          router.push(`/user/${item.actor?.username}`);
        } else if (item.post_id) {
          router.push(`/post/${item.post_id}`);
        }
      }}
    >
      <View style={styles.activityContent}>
        <View style={styles.activityText}>
          <Text style={styles.activityDescription}>
            {getActivityText(item)}
          </Text>
          <Text style={styles.activityTime}>
            {formatTimeAgo(item.created_at)}
          </Text>
        </View>
        {item.post?.image_url && (
          <Image
            source={{ uri: item.post.image_url }}
            style={styles.activityThumbnail}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {feedType === 'you'
            ? 'No activity yet'
            : 'Follow users to see their activity'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
        <View style={styles.toggleContainer}>
          {['you', 'following', 'all'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.toggle, feedType === type && styles.toggleActive]}
              onPress={() => setFeedType(type as ActivityFeedType)}
            >
              <Text
                style={[
                  styles.toggleText,
                  feedType === type && styles.toggleTextActive,
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          renderItem={renderActivity}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: { fontSize: 24, fontWeight: '700', color: '#000', marginBottom: 12 },
  toggleContainer: { flexDirection: 'row', gap: 12 },
  toggle: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  toggleActive: { backgroundColor: '#000' },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#666' },
  toggleTextActive: { color: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  activityItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  activityContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityText: { flex: 1, paddingRight: 12 },
  activityDescription: { fontSize: 14, color: '#000', marginBottom: 4 },
  activityTime: { fontSize: 12, color: '#999' },
  activityThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  emptyContainer: { paddingTop: 60, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#999' },
});
