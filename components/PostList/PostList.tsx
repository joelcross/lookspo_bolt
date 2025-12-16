import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import styled from 'styled-components/native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { Post } from '@/lib/types';
import { FlashList } from '@shopify/flash-list';
import PostCard from '../PostCard';

interface PostListProps {
  posts: Post[];
  loading: boolean;
  refreshing: boolean;
  handleRefresh?: () => void;
  handleLoadMore?: () => void;
  emptyText?: string;
  numColumns?: number;
  hideTopBar?: boolean;
}

const PostList: React.FC<PostListProps> = ({
  posts,
  loading,
  refreshing,
  handleRefresh,
  handleLoadMore,
  emptyText = 'No posts',
  numColumns = 2,
  hideTopBar = false,
}) => {
  const renderPost = ({ item }: { item: Post }) => (
    <PostWrapper>
      <PostCard post={item} showActions={false} hideTopBar={hideTopBar} />
    </PostWrapper>
  );

  return (
    <PostsContainer showsVerticalScrollIndicator={false}>
      <FlashList
        showsVerticalScrollIndicator={false}
        masonry
        data={posts}
        numColumns={numColumns}
        renderItem={renderPost}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onEndReached={handleLoadMore}
        ListEmptyComponent={
          !loading ? (
            <EmptyContainer>
              <EmptyText>{emptyText}</EmptyText>
            </EmptyContainer>
          ) : null
        }
        ListFooterComponent={loading ? <ActivityIndicator /> : null}
        ItemSeparatorComponent={() => <View style={{ height: 5 }} />}
      />
    </PostsContainer>
  );
};

const PostWrapper = styled.View`
  margin: 5px;
  margin-bottom: 0px;
`;

const PostsContainer = styled.ScrollView`
  margin: 5px;
  padding: 5px;
  background-color: #fff;
  border-radius: 20px;
`;

const EmptyContainer = styled.View`
  padding-top: 60px;
`;

const EmptyText = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.primary[900]};
`;

export default PostList;
