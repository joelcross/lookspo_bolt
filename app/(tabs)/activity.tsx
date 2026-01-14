import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Activity } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ActivityType } from '@/components/HeaderDropdown/HeaderDropdown';
import SectionTabs from '@/components/SectionTabs/SectionTabs';
import ActivityItem from '@/components/ActivityItem/ActivityItem';
import styled from 'styled-components/native';
import { typography } from '@/theme/typography';
import { colors } from '@/theme/colors';

export default function ActivityScreen() {
  const { user } = useAuth();
  const [feedType, setFeedType] = useState<ActivityType>('you');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, [feedType, user]);

  const fetchActivities = async () => {
    if (!user) return;

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
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchActivities();
  };

  const renderEmpty = () => {
    return (
      <View>
        <EmptyText>No activity to display.</EmptyText>
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
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          renderItem={renderActivity}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
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

const EmptyText = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.neutral[400]};
  padding: 16px;
  font-style: italic;
`;

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700', color: '#000', marginBottom: 12 },
});
