import React from 'react';
import { FlatListProps, View } from 'react-native';
import styled from 'styled-components/native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { Post } from '@/lib/types';
import { FlashList } from '@shopify/flash-list';
import PostCard from '../PostCard';
import { usePathname } from 'expo-router';

interface PostListProps extends FlatListProps<Post> {
  posts: Post[];
  loading: boolean;
  refreshing: boolean;
  handleRefresh?: () => void;
  handleLoadMore?: () => void;
  emptyText?: string;
  numColumns?: number;
  hideTopBar?: boolean;
  headerText?: string;
  transparentBackground?: boolean;
}

const PostList: React.FC<PostListProps> = ({
  posts,
  loading,
  refreshing,
  handleRefresh,
  handleLoadMore,
  emptyText,
  numColumns = 2,
  hideTopBar = false,
  headerText,
  transparentBackground = false,
  ...flatListProps
}) => {
  const pathname = usePathname();

  return (
    <FlashList
      masonry
      data={posts}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      renderItem={({ item }) => (
        <PostWrapper>
          <PostCard post={item} showActions={false} hideTopBar={hideTopBar} />
        </PostWrapper>
      )}
      onRefresh={handleRefresh}
      refreshing={refreshing}
      onEndReached={handleLoadMore}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        minHeight: '100%',
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingTop: pathname === '/home' ? 70 : 0,
      }}
      ListHeaderComponent={
        <>
          {headerText && <Heading>{headerText}</Heading>}
          {flatListProps.ListHeaderComponent}
        </>
      }
      ListEmptyComponent={
        !loading && emptyText ? <EmptyText>{emptyText}</EmptyText> : null
      }
    />
  );
};

const PostWrapper = styled.View`
  margin: 5px;
  margin-bottom: 0px;
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
  margin: 10px;
  font-style: italic;
`;

export default PostList;
