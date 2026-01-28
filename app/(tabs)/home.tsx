import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { usePosts } from '@/hooks/usePosts';
import styled from 'styled-components/native';
import SectionTabs from '@/components/SectionTabs/SectionTabs';
import PostList from '@/components/PostList/PostList';
import { View } from 'react-native';
import { usePathname } from 'expo-router';

type FeedType = 'following' | 'explore';

export default function HomeScreen() {
  useRequireAuth();
  const [feedType, setFeedType] = useState<FeedType>('following');

  const mode = useMemo(() => {
    return feedType === 'following'
      ? { type: 'following' as const }
      : { type: 'all' as const };
  }, [feedType]);

  const {
    posts,
    loading,
    refreshing,
    handleLoadMore,
    handleRefresh,
    fetchPosts,
  } = usePosts(mode);

  // Fetch whenever mode changes
  useEffect(() => {
    fetchPosts(mode, true);
  }, [mode]);

  return (
    <Container>
      <SectionTabs
        options={[
          { label: 'Following', value: 'following' },
          { label: 'Explore', value: 'explore' },
        ]}
        value={feedType}
        onChange={setFeedType}
      />
      <View
        style={{
          flex: 1,
          borderRadius: 20,
          overflow: 'hidden',
        }}
      >
        <PostList
          posts={posts}
          loading={loading}
          refreshing={refreshing}
          emptyText={
            feedType === 'following'
              ? 'Follow users to see their posts here'
              : 'No posts yet'
          }
          handleLoadMore={handleLoadMore}
          handleRefresh={handleRefresh}
        />
      </View>
    </Container>
  );
}

const Container = styled.SafeAreaView`
  flex: 1;
  margin: 5px;
`;
