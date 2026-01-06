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
  headerText?: string;
}

const PostList: React.FC<PostListProps> = ({
  posts,
  loading,
  refreshing,
  handleRefresh,
  handleLoadMore,
  emptyText = '# todo - Is this default val ever used?',
  numColumns = 2,
  hideTopBar = false,
  headerText,
}) => {
  const renderPost = ({ item }: { item: Post }) => (
    <PostWrapper>
      <PostCard post={item} showActions={false} hideTopBar={hideTopBar} />
    </PostWrapper>
  );

  if (!loading && posts.length === 0) {
    return (
      <PostsContainer showsVerticalScrollIndicator={false}>
        {headerText && <Heading>{headerText}</Heading>}
        <EmptyText>{emptyText}</EmptyText>
      </PostsContainer>
    );
  }

  return (
    <PostsContainer showsVerticalScrollIndicator={false}>
      {headerText && <Heading>{headerText}</Heading>}
      <FlashList
        showsVerticalScrollIndicator={false}
        masonry
        data={posts}
        numColumns={numColumns}
        renderItem={renderPost}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onEndReached={handleLoadMore}
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
  padding-vertical: 5px;
  padding-horizontal: 8px;
  margin: 5px;
  background-color: #fff;
  border-radius: 20px;
`;

const Heading = styled.Text`
  font-family: ${typography.heading3.fontFamily};
  font-size: ${typography.heading3.fontSize}px;
  color: ${colors.secondary.medium};
  margin: 10px;
  margin-bottom: 5px;
`;

const EmptyText = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.neutral[400]};
  padding: 16px;
  font-style: italic;
`;

export default PostList;
