import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Activity } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ActivityType } from '@/components/HeaderDropdown/HeaderDropdown';
import SectionTabs from '@/components/SectionTabs/SectionTabs';
import ActivityItem from '@/components/ActivityItem/ActivityItem';
import styled from 'styled-components/native';

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

      // Exclude the current user's own actions from global feeds
      if (feedType !== 'you') {
        query = query.neq('actor_id', user.id);
      }

      if (feedType === 'you') {
        // Only show activities directed towards you, from others
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
      // 'all' feed: no extra filter needed — just show everything (except own actions)

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
    <ActivityItem
      activity={item}
      feedType={feedType}
      currentUserId={user?.id}
    />
  );

  return (
    <Container edges={['top']}>
      {/* <HeaderDropdown
        options={[
          { label: 'You', value: 'you' },
          { label: 'Following', value: 'following' },
          { label: 'All', value: 'all' },
        ]}
      /> */}

      <SectionTabs
        options={[
          { label: 'You', value: 'you' },
          { label: 'Following', value: 'following' },
          { label: 'All', value: 'all' },
        ]}
        value={feedType}
        onChange={setFeedType}
      />

      <Content>
        {loading && !refreshing ? (
          <View>
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
      </Content>
    </Container>
  );
}

const Container = styled.SafeAreaView`
  flex: 1;
`;

const Content = styled.View`
  background-color: #fff;
  flex: 1;
  margin: 5px;
  border-radius: 20px;
  overflow: hidden;
`;

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700', color: '#000', marginBottom: 12 },
  emptyContainer: { paddingTop: 60, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#999' },
});
