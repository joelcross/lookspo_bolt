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
import HeaderDropdown, {
  ActivityType,
} from '@/components/HeaderDropdown/HeaderDropdown';
import PillHeader from '@/components/PillHeader/PillHeader';
import ActivityItem from '@/components/ActivityItem/ActivityItem';

export default function ActivityScreen() {
  const { user } = useAuth();
  const [feedType, setFeedType] = useState<ActivityType>('you');
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
        actor:actor_id (
          id,
          username,
          avatar_url
        ),
        target_user:target_user_id (
          id,
          username
        ),
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

  const renderActivity = ({ item }: { item: Activity }) => (
    <ActivityItem activity={item} feedType={feedType} />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* <HeaderDropdown
        options={[
          { label: 'You', value: 'you' },
          { label: 'Following', value: 'following' },
          { label: 'All', value: 'all' },
        ]}
      /> */}

      <PillHeader
        options={[
          { label: 'You', value: 'you' },
          { label: 'Following', value: 'following' },
          { label: 'All', value: 'all' },
        ]}
        value={feedType}
        onChange={setFeedType}
      />

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
  container: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700', color: '#000', marginBottom: 12 },
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
