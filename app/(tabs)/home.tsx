import React, { useState, useMemo } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { usePosts } from '@/hooks/usePosts';
import styled from 'styled-components/native';
import SectionTabs from '@/components/SectionTabs/SectionTabs';
import PostList from '@/components/PostList/PostList';

type FeedType = 'following' | 'explore';

export default function HomeScreen() {
  useRequireAuth();
  const [feedType, setFeedType] = useState<FeedType>('following');

  const mode = useMemo(() => {
    return feedType === 'following'
      ? { type: 'following' as const }
      : { type: 'all' as const };
  }, [feedType]);

  const { posts, loading, refreshing, handleLoadMore, handleRefresh } =
    usePosts(mode);

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
    </Container>
  );
}

const Container = styled.SafeAreaView`
  flex: 1;
  gap: 5px;
`;
